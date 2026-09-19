import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { NotificationType } from '@prisma/client';

interface ClaimedOutboxEvent {
  id: string;
  eventType: string;
  payload: unknown;
  attempts: number;
}

interface OrderCreatedPayload {
  orderId: string;
  userId?: string;
  total?: number;
}

interface OrderPaidPayload {
  orderId: string;
  userId?: string;
  amount?: number;
}

interface OrderStatusChangedPayload {
  orderId: string;
  userId?: string;
  status: string;
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/**
 * OutboxProcessorTask
 *
 * Implements the Transactional Outbox pattern.
 * Concurrency-safe across multiple node instances using PostgreSQL row-level
 * locks (`FOR UPDATE SKIP LOCKED`).
 * Includes exponential backoff for retried events and recovery of stalled
 * processing events older than 5 minutes.
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
      return; // In-process throttle guard
    }

    this.isRunning = true;

    try {
      // Concurrency-safe atomic claim:
      // Locks up to 20 candidate rows skipping already-locked rows by other worker instances.
      // Simultaneously transitions status to 'processing' and increments attempts.
      // Uses withRetry to handle transient Supabase pooler socket reconnects gracefully.
      const claimedEvents = await this.prisma.withRetry(() =>
        this.prisma.$queryRaw<ClaimedOutboxEvent[]>`
          UPDATE outbox_events
          SET status = 'processing',
              last_attempted_at = NOW(),
              attempts = attempts + 1
          WHERE id IN (
            SELECT id
            FROM outbox_events
            WHERE (
              status = 'pending'
              OR (status = 'processing' AND last_attempted_at < NOW() - INTERVAL '5 minutes')
            )
            AND attempts < 3
            AND (
              last_attempted_at IS NULL
              OR last_attempted_at < NOW() - (power(2, attempts) * INTERVAL '15 seconds')
            )
            ORDER BY created_at ASC
            LIMIT 20
            FOR UPDATE SKIP LOCKED
          )
          RETURNING id, event_type AS "eventType", payload, attempts;
        `,
      );

      if (!claimedEvents || claimedEvents.length === 0) {
        return;
      }

      for (const event of claimedEvents) {
        await this.handleEvent(event);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('P1001') || msg.includes("Can't reach database server")) {
        this.logger.warn(
          `[Transient Pooler Notice] Outbox processing cycle deferred until pooler socket reconnects: ${msg.slice(0, 100)}`,
        );
      } else {
        this.logger.error('Error in outbox processing cycle', msg);
      }
    } finally {
      this.isRunning = false;
    }
  }

  private async handleEvent(event: ClaimedOutboxEvent): Promise<void> {
    try {
      // Dispatch based on event type
      switch (event.eventType) {
        case 'ORDER_CREATED':
          if (isRecord(event.payload) && typeof event.payload['orderId'] === 'string') {
            const p: OrderCreatedPayload = {
              orderId: event.payload['orderId'],
              userId: typeof event.payload['userId'] === 'string' ? event.payload['userId'] : undefined,
              total: typeof event.payload['total'] === 'number' ? event.payload['total'] : undefined,
            };
            await this.processOrderCreated(p);
          }
          break;

        case 'ORDER_PAID':
          if (isRecord(event.payload) && typeof event.payload['orderId'] === 'string') {
            const p: OrderPaidPayload = {
              orderId: event.payload['orderId'],
              userId: typeof event.payload['userId'] === 'string' ? event.payload['userId'] : undefined,
              amount: typeof event.payload['amount'] === 'number' ? event.payload['amount'] : undefined,
            };
            await this.processOrderPaid(p);
          }
          break;

        case 'ORDER_STATUS_CHANGED':
          if (
            isRecord(event.payload) &&
            typeof event.payload['orderId'] === 'string' &&
            typeof event.payload['status'] === 'string'
          ) {
            const p: OrderStatusChangedPayload = {
              orderId: event.payload['orderId'],
              userId: typeof event.payload['userId'] === 'string' ? event.payload['userId'] : undefined,
              status: event.payload['status'],
            };
            await this.processOrderStatusChanged(p);
          }
          break;

        default:
          this.logger.warn(`Unknown outbox event type: ${event.eventType}`);
          break;
      }

      // Mark completed
      await this.prisma.withRetry(() =>
        this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'completed',
            processedAt: new Date(),
            error: null,
          },
        }),
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to process outbox event ${event.id} (attempt ${event.attempts}): ${errorMessage}`,
      );

      const nextStatus = event.attempts >= 3 ? 'failed' : 'pending';

      await this.prisma.withRetry(() =>
        this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: nextStatus,
            error: errorMessage.slice(0, 500),
          },
        }),
      );
    }
  }

  private async processOrderCreated(payload: OrderCreatedPayload): Promise<void> {
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

  private async processOrderPaid(payload: OrderPaidPayload): Promise<void> {
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

  private async processOrderStatusChanged(payload: OrderStatusChangedPayload): Promise<void> {
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
