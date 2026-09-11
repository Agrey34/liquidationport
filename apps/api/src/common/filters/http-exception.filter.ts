import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Patterns that indicate internal database, ORM, or server-side leaks
const SENSITIVE_PATTERNS = [
  /prisma/i,
  /database/i,
  /\b(select|insert|update|delete|drop|truncate|alter)\b/i,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
  /:\d{4,5}\b/, // Ports like :6543, :5432
  /[a-z]:\\[^"'\n]+/i, // Windows absolute paths
  /\/(?:home|usr|var|app|src|node_modules)\/[^"'\n]+/i, // Unix absolute paths
  /invocation in/i,
  /findfirst|findunique|findmany|create|update|delete/i,
];

function containsSensitiveData(text: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

function sanitizeMessage(msg: unknown, defaultMessage = 'An unexpected error occurred. Please try again later.'): string | string[] {
  if (Array.isArray(msg)) {
    // Array of validation errors (e.g. from class-validator)
    const sanitized = msg.map((m) => {
      const str = String(m);
      return containsSensitiveData(str) ? 'Invalid input provided.' : str;
    });
    return sanitized;
  }

  if (typeof msg === 'string') {
    if (containsSensitiveData(msg)) {
      return defaultMessage;
    }
    return msg;
  }

  return defaultMessage;
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let clientMessage: string | string[] = 'Internal Server Error';

    // 1. Handle standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      const rawMessage =
        typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse
          ? (exceptionResponse as Record<string, unknown>).message
          : exceptionResponse;

      // 4xx errors are usually client-actionable validation/auth errors
      if (status < 500) {
        clientMessage = sanitizeMessage(rawMessage, 'Invalid request.');
      } else {
        // 5xx errors must never leak backend details
        clientMessage = 'An internal server error occurred. Please try again later.';
      }
    }
    // 2. Handle Prisma / Database ORM Errors
    else if (
      typeof exception === 'object' &&
      exception !== null &&
      typeof (exception as { code?: unknown }).code === 'string' &&
      ((exception as { code: string }).code).startsWith('P')
    ) {
      const prismaError = exception as { code: string; meta?: { target?: string[] } };

      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = prismaError.meta?.target;
        const fieldName = Array.isArray(target) && target.length > 0 ? target[0] : 'item';
        clientMessage = `A record with this ${fieldName} already exists.`;
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        clientMessage = 'The requested record was not found.';
      } else if (prismaError.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        clientMessage = 'Invalid reference: a related record could not be found.';
      } else if (['P1000', 'P1001', 'P1002', 'P1008', 'P1017', 'P2028'].includes(prismaError.code)) {
        
        status = HttpStatus.SERVICE_UNAVAILABLE;
        clientMessage = 'Service is temporarily busy or unavailable. Please try again in a few moments.';
      } else {
        // Any other database error is a 500 internal error — never expose raw query/schema or internal terms
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        clientMessage = 'Something went wrong on our end. Please try again later.';
      }
    }
    // 3. Any other unhandled error
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      clientMessage = 'An unexpected error occurred. Please try again later.';
    }

    // Always log the complete exception internally for server diagnostics & monitoring
    const logDetails = exception instanceof Error ? exception.stack || exception.message : JSON.stringify(exception);
    if (status >= 500) {
      this.logger.error(`[Security/Server Error] ${request.method} ${request.url} - Status: ${status}\n${logDetails}`);
    } else {
      this.logger.warn(`[Client Error] ${request.method} ${request.url} - Status: ${status} - Details: ${logDetails}`);
    }

    // Secure sanitized response sent to client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: clientMessage,
    });
  }
}
