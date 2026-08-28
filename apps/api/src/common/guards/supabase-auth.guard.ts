import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string | string[];
  iss?: string;
  exp?: number;
  iat?: number;
  app_metadata?: {
    role?: string;
    [key: string]: unknown;
  };
  user_metadata?: {
    [key: string]: unknown;
  };
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private readonly supabaseAdmin: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly expectedIssuer: string;
  private readonly jwtSecret: string;
  private readonly jwtSecretBuffer: Buffer;

  // Remote fallback metrics
  private localAuthSuccessCount = 0;
  private remoteFallbackCount = 0;
  private remoteFallbackSuccessCount = 0;

  constructor(private readonly configService: ConfigService) {
    this.supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    this.expectedIssuer = `${this.supabaseUrl.replace(/\/$/, '')}/auth/v1`;
    this.jwtSecret = this.configService.getOrThrow<string>('SUPABASE_JWT_SECRET');
    this.jwtSecretBuffer = Buffer.from(this.jwtSecret, 'base64');

    this.supabaseAdmin = createClient(
      this.supabaseUrl,
      this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    // ── 1. Local Offline JWT Verification (Fast, Claims-Aware) ────────────────
    const localUser = this.verifyTokenLocally(token);
    if (localUser) {
      this.localAuthSuccessCount++;
      request['user'] = localUser;
      return true;
    }

    // ── 2. Bounded Remote Supabase Fallback (Resilient, 3s Timeout) ───────────
    this.remoteFallbackCount++;
    const remoteUser = await this.verifyTokenRemotelyWithTimeout(token, 3000);
    if (remoteUser) {
      this.remoteFallbackSuccessCount++;
      request['user'] = remoteUser;
      return true;
    }

    throw new UnauthorizedException('Invalid or expired token');
  }

  /**
   * Cryptographically verifies JWT claims locally:
   * - Signature (via HS256)
   * - Algorithm enforcement
   * - Expiration (exp)
   * - Issued-At (iat)
   * - Issuer (iss)
   * - Audience (aud)
   * - Subject (sub)
   */
  private verifyTokenLocally(token: string): Record<string, unknown> | null {
    try {
      const decodedHeader = jwt.decode(token, { complete: true });
      if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header) {
        return null;
      }

      // Enforce supported symmetric algorithms (reject 'none', 'RS256' when expecting secret)
      const alg = decodedHeader.header.alg;
      if (alg !== 'HS256') {
        // Asymmetric or unexpected algorithm: delegate to remote Supabase verification
        return null;
      }

      // Verify signature and standard time claims with raw string secret first, then buffer
      let payload: SupabaseJwtPayload | null = null;
      const verifyOptions: jwt.VerifyOptions = {
        algorithms: ['HS256'],
        issuer: [this.expectedIssuer, this.supabaseUrl],
        clockTolerance: 60, // 60-second clock skew tolerance
      };

      try {
        payload = jwt.verify(token, this.jwtSecret, verifyOptions) as SupabaseJwtPayload;
      } catch {
        try {
          payload = jwt.verify(token, this.jwtSecretBuffer, verifyOptions) as SupabaseJwtPayload;
        } catch {
          return null;
        }
      }

      if (!payload || !payload.sub) {
        return null;
      }

      // Validate audience claim if present
      if (payload.aud) {
        const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!audList.includes('authenticated') && !audList.includes('anon') && !audList.includes('service_role')) {
          this.logger.warn('Token rejected: invalid audience claim');
          return null;
        }
      }

      const role = payload.app_metadata?.role || payload.role || 'customer';

      return {
        id: payload.sub,
        email: payload.email,
        role,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
      };
    } catch {
      return null;
    }
  }

  /**
   * Bounded remote verification to prevent hanging requests during network latency spikes.
   */
  private async verifyTokenRemotelyWithTimeout(token: string, timeoutMs: number): Promise<Record<string, unknown> | null> {
    try {
      // Execute with timeout race
      const userPromise = this.supabaseAdmin.auth.getUser(token);
      const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error(`Supabase remote auth check timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response = await Promise.race([userPromise, timeoutPromise]);
      const user = response.data?.user;

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.app_metadata?.role || user.role || 'customer',
        app_metadata: user.app_metadata || {},
        user_metadata: user.user_metadata || {},
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      this.logger.warn(`Remote auth verification fallback failed: ${errMsg}`);
      return null;
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token.trim() : undefined;
  }
}
