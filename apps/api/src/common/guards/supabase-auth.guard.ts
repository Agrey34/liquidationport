import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createPublicKey, JsonWebKey, KeyObject } from 'crypto';
import { Algorithm, decode, JwtPayload, VerifyOptions, verify } from 'jsonwebtoken';

interface SupabaseJwtPayload extends JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  app_metadata?: { role?: string; [key: string]: unknown };
  user_metadata?: Record<string, unknown>;
}

interface SupabaseJwk extends JsonWebKey {
  kid?: string;
  alg?: string;
}

interface SupabaseJwks {
  keys: SupabaseJwk[];
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private get jwtSecret(): string | undefined {
    return process.env.SUPABASE_JWT_SECRET;
  }
  private readonly jwks = this.loadJwks(process.env.SUPABASE_JWKS);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    try {
      const header = decode(token, { complete: true })?.header;
      if (header?.alg !== 'HS256' && header?.alg !== 'ES256') {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const payload = this.verifyOffline(token, header.alg, header.kid);

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (payload.iss && process.env.SUPABASE_URL) {
        const expectedIssuer = `${process.env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1`;
        if (payload.iss !== expectedIssuer) {
          throw new UnauthorizedException('Invalid or expired token');
        }
      }

      if (payload.aud) {
        const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
        if (!audList.includes('authenticated') && !audList.includes('anon')) {
          throw new UnauthorizedException('Invalid or expired token');
        }
      }

      // Authorization data comes from verified app_metadata, never user_metadata.
      request['user'] = {
        ...payload,
        id: payload.sub,
        role: payload.app_metadata?.role ?? payload.role ?? 'customer',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractBearerToken(request: Request): string | undefined {
    const [scheme, token] = request.headers.authorization?.trim().split(/\s+/, 2) ?? [];
    return scheme === 'Bearer' && token ? token : undefined;
  }

  private verifyOffline(token: string, algorithm: 'HS256' | 'ES256', keyId?: string): SupabaseJwtPayload {
    const options: VerifyOptions = { algorithms: [algorithm as Algorithm], clockTolerance: 60 };

    if (algorithm === 'HS256') {
      const secret = this.jwtSecret;
      if (!secret) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Supabase JWT secret is base64 encoded by default: convert to Buffer before running verify()
      try {
        const secretBuffer = Buffer.from(secret, 'base64');
        return verify(token, secretBuffer, options) as SupabaseJwtPayload;
      } catch (bufferErr) {
        // Fallback to standard raw string verification if base64 decoding fails or token was signed with raw string
        try {
          return verify(token, secret, options) as SupabaseJwtPayload;
        } catch {
          throw bufferErr;
        }
      }
    }

    if (algorithm === 'ES256' && keyId) {
      const jwk = this.jwks?.keys.find((candidate) => candidate.kid === keyId && candidate.alg === 'ES256');
      if (jwk) {
        const publicKey: KeyObject = createPublicKey({ key: jwk, format: 'jwk' });
        return verify(token, publicKey, options) as SupabaseJwtPayload;
      }
    }

    throw new UnauthorizedException('Invalid or expired token');
  }

  private loadJwks(value: string | undefined): SupabaseJwks | undefined {
    if (!value) return undefined;
    try {
      const jwks = JSON.parse(value) as SupabaseJwks;
      return Array.isArray(jwks.keys) ? jwks : undefined;
    } catch {
      return undefined;
    }
  }
}
