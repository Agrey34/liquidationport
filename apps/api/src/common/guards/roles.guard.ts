import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedRequest } from '../../types/authenticated-request.interface';

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

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User is not authenticated');
    }

    // Role hierarchy: higher roles inherit all lower role privileges.
    // SECURITY: roles are resolved from verified JWT app_metadata, never client-supplied.
    const roleHierarchy: Record<string, string[]> = {
      super_admin: ['super_admin', 'admin', 'customer', 'buyer'],
      admin: ['admin', 'customer', 'buyer'],
      customer: ['customer', 'buyer'],
      buyer: ['buyer', 'customer'],
    };

    // 1. Primary: Check verified claim from JWT app_metadata (server-set, trusted)
    let userRole: string | undefined = user.app_metadata?.role;
    if (!userRole || userRole === 'authenticated') {
      // Supabase default payload.role is 'authenticated' — not a domain role
      userRole = user.role && user.role !== 'authenticated' ? user.role : undefined;
    }

    const effectiveRoles = userRole ? (roleHierarchy[userRole] ?? [userRole]) : [];
    let hasRole = requiredRoles.some((role) => effectiveRoles.includes(role));

    // 2. Fallback: DB lookup when JWT role is absent or stale
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
          const dbEffectiveRoles = roleHierarchy[userRole] ?? [userRole];
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
