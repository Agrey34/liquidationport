import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse 
         ? (exceptionResponse as any).message 
         : exceptionResponse;
    }

    // Log the error securely (Don't leak stack traces to the client layer!)
    const isProd = process.env.NODE_ENV === 'production';
    if (status >= 500) {
      this.logger.error(
        `Critical Exception: ${request.method} ${request.url} - ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`
      );
      // Mask 500 errors in production so we do not leak database or ORM structures
      if (isProd) message = 'Internal Server Error';
    } else {
      this.logger.warn(`Exception: ${request.method} ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`);
    }

    // Standard JSON structure mapped back to the client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
