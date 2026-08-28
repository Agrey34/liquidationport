import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl } = request;
    const startTime = Date.now();

    // Attach or extract request ID for end-to-end telemetry
    const incomingRequestId = request.headers['x-request-id'];
    const requestId = (typeof incomingRequestId === 'string' && incomingRequestId.trim())
      ? incomingRequestId.trim()
      : crypto.randomUUID().slice(0, 8);

    request['requestId'] = requestId;
    if (response.setHeader && !response.headersSent) {
      response.setHeader('x-request-id', requestId);
    }

    // Sanitize path (strip potential sensitive query values)
    const sanitizedUrl = originalUrl.replace(/(token|secret|password|key|authorization)=[^&]+/gi, '$1=***');

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          if (duration > 1000) {
            this.logger.warn(
              `[SLOW REQUEST] requestId=${requestId} method=${method} route=${sanitizedUrl} status=${statusCode} total=${duration}ms`
            );
          } else {
            this.logger.log(`requestId=${requestId} ${method} ${sanitizedUrl} ${statusCode} +${duration}ms`);
          }
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const status = (err as { status?: number }).status || 500;
          this.logger.warn(
            `[REQUEST FAILED] requestId=${requestId} ${method} ${sanitizedUrl} ${status} +${duration}ms`
          );
        },
      }),
    );
  }
}

