import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // No roles required, access granted
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user; // User object attached by SupabaseAuthGuard

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Check if user's role is in the list of required roles
    // We get role from user.app_metadata.role or fallback to 'customer'
    const userRole = user.app_metadata?.role || 'customer';
    
    const hasRole = requiredRoles.includes(userRole);

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
