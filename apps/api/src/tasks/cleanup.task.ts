import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';

/**
 * CleanupTask
 *
 * Scheduled maintenance jobs that run on a recurring basis.
 * All operations are idempotent and safe to run multiple times.
 */
@Injectable()
export class CleanupTask {
  private readonly logger = new Logger(CleanupTask.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Purge expired guest sessions and their cascade-deleted cart/wishlist data.
   * Runs at 3 AM daily to minimize impact on peak traffic.
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredGuestSessions(): Promise<void> {
    try {
      const result = await this.prisma.withRetry(() =>
        this.prisma.guestSession.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        }),
      );

      if (result.count > 0) {
        this.logger.log(`Purged ${result.count} expired guest sessions`);
      }
    } catch (err: unknown) {
      this.logger.error('Failed to purge expired guest sessions', String(err));
    }
  }

  /**
   * Purge expired idempotency keys.
   * Runs every hour — keys are short-lived (minutes to hours).
   */
  @Cron(CronExpression.EVERY_HOUR)
  async purgeExpiredIdempotencyKeys(): Promise<void> {
    try {
      const result = await this.prisma.withRetry(() =>
        this.prisma.idempotencyKey.deleteMany({
          where: { expiresAt: { lt: new Date() } },
        }),
      );

      if (result.count > 0) {
        this.logger.log(`Purged ${result.count} expired idempotency keys`);
      }
    } catch (err: unknown) {
      this.logger.error('Failed to purge expired idempotency keys', String(err));
    }
  }
}
