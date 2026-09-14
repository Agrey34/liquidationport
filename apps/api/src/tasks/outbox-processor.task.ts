import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationType } from '@prisma/client';

/**
 * OutboxProcessorTask
 *
 * Implements the Transactional Outbox pattern.
 * Regularly processes pending events from `outbox_events` to ensure
 * asynchronous side effects (notifications, emails, external webhooks)
 * execute reliably without blocking the critical database transaction.
 */
@Injectable()
export class OutboxProcessorTask {
  private readonly logger = new Logger(OutboxProcessorTask.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Poll and process pending outbox events every 10 seconds.
   */
  @Cron('*/10 * * * * *')
  async processOutboxEvents(): Promise<void> {
    if (this.isRunning) {
      return; // Prevent overlapping runs
    }

    this.isRunning = true;

    try {
      // Fetch up to 20 pending or retryable events
      const events = await this.prisma.outboxEvent.findMany({
        where: {
          status: 'pending',
          attempts: { lt: 3 },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      if (events.length === 0) {
        return;
      }

      for (const event of events) {
        await this.handleEvent(event);
      }
    } catch (err: unknown) {
      this.logger.error('Error in outbox processing cycle', String(err));
    } finally {
      this.isRunning = false;
    }
  }

  private async handleEvent(event: {
    id: string;
    eventType: string;
    payload: any;
    attempts: number;
  }): Promise<void> {
    try {
      // Mark as processing
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'processing',
          lastAttemptedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      // Dispatch based on event type
      switch (event.eventType) {
        case 'ORDER_CREATED':
          await this.processOrderCreated(event.payload);
          break;
        case 'ORDER_PAID':
          await this.processOrderPaid(event.payload);
          break;
        case 'ORDER_STATUS_CHANGED':
          await this.processOrderStatusChanged(event.payload);
          break;
        default:
          this.logger.warn(`Unknown outbox event type: ${event.eventType}`);
          break;
      }

      // Mark completed
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
          error: null,
        },
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to process outbox event ${event.id} (attempt ${event.attempts + 1}): ${errorMessage}`,
      );

      const nextStatus = event.attempts + 1 >= 3 ? 'failed' : 'pending';

      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          status: nextStatus,
          error: errorMessage,
        },
      });
    }
  }

  private async processOrderCreated(payload: {
    orderId: string;
    userId?: string;
    total: number;
  }): Promise<void> {
    if (!payload.userId) return;

    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: NotificationType.order_created,
        title: 'Order Placed',
        message: `Your order #${payload.orderId.slice(0, 8)} has been placed successfully.`,
      },
    });
  }

  private async processOrderPaid(payload: {
    orderId: string;
    userId?: string;
    amount: number;
  }): Promise<void> {
    if (!payload.userId) return;

    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: NotificationType.order_paid,
        title: 'Payment Confirmed',
        message: `Payment for order #${payload.orderId.slice(0, 8)} has been confirmed.`,
      },
    });
  }

  private async processOrderStatusChanged(payload: {
    orderId: string;
    userId?: string;
    status: string;
  }): Promise<void> {
    if (!payload.userId) return;

    let notificationType: NotificationType = NotificationType.system;
    if (payload.status === 'shipped') notificationType = NotificationType.order_shipped;
    else if (payload.status === 'delivered') notificationType = NotificationType.order_delivered;

    await this.prisma.notification.create({
      data: {
        userId: payload.userId,
        type: notificationType,
        title: `Order Status: ${payload.status.toUpperCase()}`,
        message: `Order #${payload.orderId.slice(0, 8)} status updated to ${payload.status}.`,
      },
    });
  }
}
