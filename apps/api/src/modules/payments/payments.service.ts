import {
  Injectable,
  NotFoundException,
  BadRequestException,
  RawBodyRequest,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/payment.dto';
import { Request } from 'express';
import { StripeProvider } from './providers/stripe.provider';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeProvider: StripeProvider,
  ) {}

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to you');
    }

    if (order.status !== 'pending') {
      throw new BadRequestException('Order is no longer pending payment');
    }

    // Call payment provider abstraction (Stripe or Mock)
    const providerResult = await this.stripeProvider.createPaymentIntent({
      amount: Number(order.total),
      currency: order.currency || 'USD',
      orderId: order.id,
      customerEmail: order.user?.email,
      metadata: { orderId: order.id, userId },
    });

    // Store or update payment record
    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        providerId: providerResult.providerId,
        amount: order.total,
        status: 'pending',
      },
      create: {
        orderId: order.id,
        provider: this.stripeProvider.name,
        providerId: providerResult.providerId,
        amount: order.total,
        status: 'pending',
      },
    });

    return {
      clientSecret: providerResult.clientSecret,
    };
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    // 1. Verify signature and parse the webhook via provider
    const event = await this.stripeProvider.verifyWebhook(
      req.rawBody || (req.body as any),
      signature,
    );

    // 2. Process inside a database transaction to ensure idempotency and integrity
    return this.prisma.$transaction(
      async (tx) => {
        // Idempotency check: verify if this webhook event was already recorded
        const existingEvent = await tx.paymentEvent.findFirst({
          where: {
            payload: {
              path: ['id'],
              equals: event.id,
            },
          },
        });

        if (existingEvent) {
          this.logger.log(`Duplicate webhook event ignored: ${event.id}`);
          return { received: true, duplicate: true };
        }

        // 3. Log event for audit and replay
        const paymentEvent = await tx.paymentEvent.create({
          data: {
            eventType: event.type,
            payload: event.rawPayload,
          },
        });

        // 4. Handle successful payment
        if (event.status === 'succeeded' && event.providerPaymentId) {
          const payment = await tx.payment.findFirst({
            where: { providerId: event.providerPaymentId },
            include: {
              order: {
                include: { items: true },
              },
            },
          });

          if (payment && payment.order && payment.order.status === 'pending') {
            // Update payment status
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'paid' },
            });

            // Update order status to paid
            await tx.order.update({
              where: { id: payment.orderId },
              data: {
                status: 'paid',
                updatedAt: new Date(),
              },
            });

            // Record status change history
            await tx.orderStatusHistory.create({
              data: {
                orderId: payment.orderId,
                status: 'paid',
                note: `Payment verified via webhook event: ${paymentEvent.id}`,
              },
            });

            // Finalize inventory: deduct stock quantity and release reservation
            for (const item of payment.order.items) {
              if (item.variantId) {
                await tx.inventory.updateMany({
                  where: { variantId: item.variantId },
                  data: {
                    quantity: { decrement: item.quantity },
                    reserved: { decrement: item.quantity },
                  },
                });

                // Record inventory movement audit
                await tx.inventoryMovement.create({
                  data: {
                    variantId: item.variantId,
                    quantityChange: -item.quantity,
                    type: 'SALE',
                    referenceType: 'order',
                    referenceId: payment.orderId,
                    note: `Payment confirmed for order #${payment.orderId}`,
                  },
                });
              }
            }

            // Write transactional outbox event for reliable notification
            await tx.outboxEvent.create({
              data: {
                eventType: 'ORDER_PAID',
                payload: {
                  orderId: payment.orderId,
                  userId: payment.order.userId,
                  amount: Number(payment.amount),
                },
                status: 'pending',
              },
            });

            this.logger.log(`Order ${payment.orderId} successfully marked as PAID`);
          }
        }

        return { received: true };
      },
      {
        maxWait: 15000,
        timeout: 20000,
      },
    );
  }
}
