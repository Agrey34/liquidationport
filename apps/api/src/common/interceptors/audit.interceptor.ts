import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    
    // Only intercept mutating requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = request.user;
    
    // Only audit admin actions
    if (!user || user.app_metadata?.role !== 'admin') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          const url = request.url;
          let entity = 'system';
          
          // Extract entity name from URL (e.g. /api/v1/products -> products)
          const urlParts = url.split('/');
          const v1Index = urlParts.indexOf('v1');
          if (v1Index !== -1 && urlParts.length > v1Index + 1) {
             entity = urlParts[v1Index + 1].split('?')[0]; // Remove query params
          } else if (urlParts.length > 1) {
             entity = urlParts[1].split('?')[0];
          }

          // Don't audit the audit logs themselves to avoid infinite loops
          if (entity === 'audit') return;

          let entityId = null;
          // Try to get entityId from params or body
          if (request.params?.id) {
            entityId = request.params.id;
          } else if (request.body?.id) {
             entityId = request.body.id;
          }
          
          const ipAddress = (request.headers['x-forwarded-for'] || request.ip || '') as string;
          const userAgent = (request.headers['user-agent'] || '') as string;
          const userName = user.email || 'Unknown';
          const userRole = user.app_metadata?.role || 'admin';

          // Basic validation for UUID
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const validEntityId = typeof entityId === 'string' && uuidRegex.test(entityId) ? entityId : null;

          // Non-blocking fire and forget
          this.prisma.auditLog.create({
            data: {
              userId: user.id,
              userName,
              userRole,
              action: method,
              entity: entity,
              entityId: validEntityId,
              details: request.body || request.query || {},
              ipAddress,
              userAgent
            },
          }).catch((err) => {
             console.error('Failed to create audit log asynchronously:', err);
          });
        } catch (error) {
          console.error('Failed to create audit log:', error);
        }
      }),
    );
  }
}
