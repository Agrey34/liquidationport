import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // If running behind Cloudflare or Vercel proxy, trust proxy to get raw client IP
    rawBody: true // Vital for Stripe Webhook signature verification
  });

  // Proxy IP mapping if deployed behind a Load Balancer or CDN
  // const expressApp = app.getHttpAdapter().getInstance();
  // expressApp.set('trust proxy', 1);

  // --- SECURITY: HELMET ---
  // Sets strong HTTP headers to mitigate classic web vulnerabilities (XSS, Clickjacking, MIME snapping)
  app.use(helmet());

  // --- SECURITY: CORS ---
  // Restricting cross-origin resource sharing.
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // --- SECURITY: GLOBAL VALIDATION PIPE ---
  // Any DTO body validation occurs globally here based on class-validator decorators.
  // We explicitly strip malicious non-whitelisted params using forbidNonWhitelisted.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // Strip any props not explicitly mentioned in the DTO
      forbidNonWhitelisted: true,    // Throw an error if extraneous props are found
      transform: true,               // Automatically map plain payloads to DTO instances
    })
  );

  // --- SECURITY: GLOBAL EXCEPTION MASKING ---
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // --- INTERCEPTORS ---
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Prefix endpoints for REST standards
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT || 4000);
}

bootstrap();
