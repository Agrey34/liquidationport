import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Resilient execution wrapper for queries with automatic retry on transient pooler drops (P1001, P1002, P1008, P1017)
   */
  async withRetry<T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> {
    let attempts = 0;
    while (true) {
      try {
        return await operation();
      } catch (error: any) {
        attempts++;
        const isConnectionError =
          error?.code &&
          ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code);

        if (!isConnectionError || attempts > maxRetries) {
          throw error;
        }

        const delay = attempts * 300;
        this.logger.warn(
          `[Transient DB Connectivity Notice - ${error.code}] Retrying database operation (Attempt ${attempts}/${maxRetries}) in ${delay}ms...`,
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
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
          // Do not crash the entire process so that GlobalHttpExceptionFilter and health checks can respond with 503
          this.logger.error(
            'Database connection could not be established on startup. Server running in degraded state; will attempt reconnection on demand.',
          );
          return;
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
