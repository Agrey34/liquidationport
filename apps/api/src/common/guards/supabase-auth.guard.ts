import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabaseUrl = process.env.SUPABASE_URL || '';
  private supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token missing');
    }

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
       console.warn('Supabase URL or Anon Key is missing. Check environment variables.');
       throw new UnauthorizedException('Authentication misconfigured');
    }

    try {
      // Connect to Supabase Auth to decode & verify token validity
      const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      // Attach user payload to the request object for downstream controllers
      // The user object contains id, role, email etc.
      request['user'] = user;
    } catch (err) {
      throw new UnauthorizedException('Invalid authentication payload');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
