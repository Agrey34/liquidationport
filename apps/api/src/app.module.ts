import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    // --- RATE LIMITING ---
    // Protects endpoints from DDoS and brute force attacks
    ThrottlerModule.forRoot([
      {
        name: 'short', // Burst limiting
        ttl: 1000,     // 1 second
        limit: 3,      // Max 3 requests per second
      },
      {
        name: 'medium', // Standard sustained limiting
        ttl: 10000,     // 10 seconds
        limit: 20       // Max 20 requests per 10 seconds
      },
      {
        name: 'long',   // Deep sustained
        ttl: 60000,     // 1 minute
        limit: 100      // Max 100 requests per minute
      }
    ]),

    // --- CACHING ---
    // In-memory cache manager as alternative to Redis
    // Configured for 5 minutes global TTL to protect Postgres DB
    CacheModule.register({
      isGlobal: true,
      ttl: 300000,    // 5 minutes in milliseconds
      max: 1000,      // maximum 1000 items in cache
    }),

    // --- DATABASE ---
    DatabaseModule,

    // --- FEATURE MODULES ---
    ProductsModule,
  ],
  controllers: [],
  providers: [
    // Register global rate limiter
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
