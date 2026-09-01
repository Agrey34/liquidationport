import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(),
    {
      // If running behind Cloudflare or Vercel proxy, trust proxy to get raw client IP
      rawBody: true, // Vital for Stripe Webhook signature verification
    },
  );

  // Proxy IP mapping if deployed behind a Load Balancer or CDN
  // const expressApp = app.getHttpAdapter().getInstance();
  // expressApp.set('trust proxy', 1);

  // --- SECURITY: HELMET ---
  // Sets strong HTTP headers to mitigate classic web vulnerabilities (XSS, Clickjacking, MIME snapping)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const rawOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://liquidationport-web-66dj-amber.vercel.app',
  ];

  // Flatten and normalize configured origins (split comma-separated lists, remove trailing slashes)
  const configuredOrigins = rawOrigins
    .filter(Boolean)
    .flatMap((entry) => (entry as string).split(','))
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter((s) => s.length > 0);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.trim().replace(/\/+$/, '');

      if (
        configuredOrigins.includes(normalizedOrigin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin) ||
        /^https:\/\/.*\.vercel\.app$/.test(normalizedOrigin)
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
      return callback(null, false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });
  // --- SECURITY: GLOBAL VALIDATION PIPE ---
  // Any DTO body validation occurs globally here based on class-validator decorators.
  // We explicitly strip malicious non-whitelisted params using forbidNonWhitelisted.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip any props not explicitly mentioned in the DTO
      forbidNonWhitelisted: true, // Throw an error if extraneous props are found
      transform: true, // Automatically map plain payloads to DTO instances
    }),
  );

  // --- SECURITY: GLOBAL EXCEPTION MASKING ---
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // --- INTERCEPTORS ---
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Prefix endpoints for REST standards
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 API Server listening on http://localhost:${port}/api/v1`);
}

bootstrap();
