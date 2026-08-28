import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { CacheModule } from './common/cache/cache.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { UsersModule } from './modules/users/users.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CartsModule } from './modules/carts/carts.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShipmentsModule } from './modules/shipments/shipments.module';
import { OrderStatusHistoryModule } from './modules/order_status_history/order_status_history.module';
import { AdminsModule } from './modules/admins/admins.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { BackupModule } from './modules/backup/backup.module';
import { StorageModule } from './modules/storage/storage.module';

import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validate } from './config/env.validation';

@Module({
  imports: [
    // --- GLOBAL CONFIGURATION ---
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    // --- RATE LIMITING ---
    // Protects endpoints from DDoS and brute force attacks
    ThrottlerModule.forRoot([
      {
        name: 'short', // Burst limiting
        ttl: 1000,     // 1 second
        limit: 10,     // Max 10 requests per second
      },
      {
        name: 'medium', // Standard sustained limiting
        ttl: 10000,     // 10 seconds
        limit: 50,      // Max 50 requests per 10 seconds
      },
      {
        name: 'long',   // Deep sustained
        ttl: 60000,     // 1 minute
        limit: 200,     // Max 200 requests per minute
      },
    ]),

    // --- GLOBAL CACHING ---
    CacheModule,

    // --- DATABASE ---
    DatabaseModule,

    // --- SYSTEM & HEALTH ---
    HealthModule,

    // --- FEATURE MODULES ---
    ProductsModule,
    OrdersModule,
    CategoriesModule,
    TagsModule,
    UsersModule,
    AddressesModule,
    CartsModule,
    CouponsModule,
    PaymentsModule,
    ShipmentsModule,
    OrderStatusHistoryModule,
    AdminsModule,
    AuditModule,
    ReviewsModule,
    NotificationsModule,
    SettingsModule,
    BackupModule,
    // Hybrid Storage (Cloudflare R2 + Supabase Storage)
    StorageModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
