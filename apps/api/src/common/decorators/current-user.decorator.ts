import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../types/authenticated-request.interface';

/**
 * Parameter decorator to extract the authenticated user from the request.
 *
 * Usage:
 * ```ts
 * @Get('profile')
 * @UseGuards(SupabaseAuthGuard)
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 * ```
 *
 * Optionally extract a specific property:
 * ```ts
 * getProfile(@CurrentUser('id') userId: string) {}
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | AuthenticatedUser[keyof AuthenticatedUser] => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
