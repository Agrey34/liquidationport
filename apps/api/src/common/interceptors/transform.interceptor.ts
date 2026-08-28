import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    return next.handle().pipe(
      map(data => {
        // If the response already has a `data` key (e.g. paginated responses with meta,
        // or service responses with kpis/stats), return as-is to avoid double-wrapping.
        if (data && typeof data === 'object' && 'data' in data) {
          return data;
        }

        // Otherwise, wrap plain values/objects in a data envelope
        return { data };
      }),
    );
  }
}
