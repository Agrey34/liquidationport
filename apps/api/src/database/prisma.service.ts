import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

interface PrismaErrorWithCode {
  code?: string;
  message?: string;
}

function isPrismaErrorWithCode(err: unknown): err is PrismaErrorWithCode {
  return typeof err === 'object' && err !== null && 'code' in err;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = process.env.SUPABASE_DATABASE_URL;
    super({
      datasources: url ? { db: { url } } : undefined,
    });
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
      } catch (error: unknown) {
        attempts++;
        const code = isPrismaErrorWithCode(error) ? error.code : undefined;
        const isConnectionError =
          typeof code === 'string' &&
          ['P1001', 'P1002', 'P1008', 'P1017'].includes(code);

        if (!isConnectionError || attempts > maxRetries) {
          throw error;
        }

        const jitter = Math.floor(Math.random() * 100);
        const delay = attempts * 300 + jitter;
        this.logger.warn(
          `[Transient DB Connectivity Notice - ${code}] Retrying database operation (Attempt ${attempts}/${maxRetries}) in ${delay}ms...`,
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
