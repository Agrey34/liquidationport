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
    await this.connectWithRetry();
  }

  private async connectWithRetry(maxRetries = 5, initialDelayMs = 1000) {
    let delay = initialDelayMs;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const start = Date.now();
      try {
        if (attempt > 1) {
          this.logger.log(`Retrying database connection (Attempt ${attempt}/${maxRetries})...`);
        }
        await this.$connect();
        await this.$queryRaw`SELECT 1`;
        const elapsed = Date.now() - start;
        this.logger.log(`Prisma database connection established and verified in ${elapsed} ms.`);
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown Prisma initialization error';
        const isLastAttempt = attempt === maxRetries;

        if (isLastAttempt) {
          const tenantOrUserIssue = message.toLowerCase().includes('tenant or user not found');
          this.logger.error('Prisma initialization failed after maximum retries.', message);
          if (tenantOrUserIssue) {
            this.logger.error(
              'SUPABASE_DATABASE_URL appears invalid for this project (tenant/user mismatch). Verify host, username, and password in your environment.',
            );
          }
          throw new Error(
            tenantOrUserIssue
              ? 'Database connection failed: invalid Supabase database credentials or tenant configuration.'
              : 'Database connection failed during Prisma initialization after retries.',
          );
        }

        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${message}. Retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 10000);
      }
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      app.close();
    });
  }
}
