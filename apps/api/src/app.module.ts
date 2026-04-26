import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
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
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';

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
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [],
  providers: [
    // Register global rate limiter removed temporarily to fix Reflector DI issue
  ],
})
export class AppModule {}
