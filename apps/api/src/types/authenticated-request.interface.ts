import { Request } from 'express';

/**
 * The authenticated user object attached to the request by SupabaseAuthGuard.
 *
 * SECURITY NOTE:
 * - `role` is sourced exclusively from `app_metadata.role` in the verified JWT.
 * - `app_metadata` is set by privileged server-side code only (service role key).
 * - `user_metadata` is user-editable and MUST NOT be used for authorization.
 */
export interface AuthenticatedUser {
  /** Supabase user UUID — used as the application userId */
  id: string;
  /** Email from JWT sub/email claim */
  email?: string;
  /**
   * Resolved domain role (from app_metadata.role).
   * Values: 'buyer' | 'customer' | 'admin' | 'super_admin' | 'authenticated'
   */
  role: string;
  /** Raw app_metadata claims from the JWT (server-set, trusted) */
  app_metadata?: {
    role?: string;
    [key: string]: unknown;
  };
  /** Raw user_metadata claims from the JWT (user-editable, do NOT use for auth) */
  user_metadata?: Record<string, unknown>;
  /** JWT issued-at timestamp */
  iat?: number;
  /** JWT expiry timestamp */
  exp?: number;
  /** JWT issuer */
  iss?: string;
  /** JWT audience */
  aud?: string | string[];
}

/**
 * Extends Express Request with a guaranteed typed `user` property.
 * Used in all protected controllers instead of `Request` or `any`.
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  /** Request ID attached by LoggingInterceptor for end-to-end telemetry */
  requestId?: string;
}
