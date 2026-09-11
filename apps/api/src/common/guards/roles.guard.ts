import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required, access granted
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user; // User object attached by SupabaseAuthGuard

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Role hierarchy mapping: higher roles inherit all lower role privileges
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ['super_admin', 'admin', 'customer'],
      admin: ['admin', 'customer'],
      customer: ['customer'],
    };

    // 1. Check verified claim from JWT payload
    let userRole = user.app_metadata?.role;
    if (!userRole || userRole === 'authenticated') {
      // In Supabase, default payload.role is 'authenticated', which is not a domain role
      userRole = user.role && user.role !== 'authenticated' ? user.role : null;
    }

    const effectiveRoles = userRole ? (roleHierarchy[userRole] || [userRole]) : [];
    let hasRole = requiredRoles.some((role) => effectiveRoles.includes(role));

    // 2. Fallback to database lookup if token role is missing, stale, or insufficient
    if (!hasRole && user.id && this.prisma) {
      try {
        const adminRecord = await this.prisma.admin.findUnique({
          where: { id: user.id },
          select: { role: true },
        });

        if (adminRecord) {
          userRole = adminRecord.role;
        } else {
          const userRecord = await this.prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          if (userRecord) {
            userRole = userRecord.role;
          }
        }

        if (userRole) {
          request.user.role = userRole;
          const dbEffectiveRoles = roleHierarchy[userRole] || [userRole];
          hasRole = requiredRoles.some((role) => dbEffectiveRoles.includes(role));
        }
      } catch {
        // Fall through to forbidden if database lookup fails
      }
    }

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
