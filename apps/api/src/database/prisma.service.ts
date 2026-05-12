import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    // Pass robust pool configurations securely via the constructor block if not natively bounded in the URL
    super();
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Prisma database connection established.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Prisma initialization error';
      const tenantOrUserIssue = message.toLowerCase().includes('tenant or user not found');

      this.logger.error('Prisma initialization failed during startup.', message);
      if (tenantOrUserIssue) {
        this.logger.error(
          'SUPABASE_DATABASE_URL appears invalid for this project (tenant/user mismatch). Verify host, username, and password in your environment.',
        );
      }

      throw new Error(
        tenantOrUserIssue
          ? 'Database connection failed: invalid Supabase database credentials or tenant configuration.'
          : 'Database connection failed during Prisma initialization.',
      );
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    // Note: Due to Prisma 5.x lifecycle deprecations this requires casting or native NestJS shutdown overrides
    // For Vercel/Serverless we map safe disconnects.
    process.on('beforeExit', () => {
      app.close();
    });
  }
}
