import { Injectable, NotFoundException, BadRequestException, RawBodyRequest } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePaymentIntentDto } from './dto/payment.dto';
import { Request } from 'express';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
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

    // In a real app, call Stripe API here:
    // const paymentIntent = await stripe.paymentIntents.create({ amount: order.total * 100, currency: order.currency })
    // Then store payment info in our DB
    
    // Mocking response
    const payment = await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: {}, // if it exists, leave it for now
      create: {
        orderId: order.id,
        provider: 'stripe',
        providerId: 'pi_mock_' + Date.now(),
        amount: order.total,
        status: 'pending',
      },
    });

    return {
      clientSecret: 'mock_client_secret_' + payment.providerId,
    };
  }

  async handleWebhook(req: RawBodyRequest<Request>, signature: string) {
    // In a real application, you would verify the Stripe signature:
    // const event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    const event = req.body; // Using body for mock purposes
    
    // Process the payment webhook updates inside a single database transaction to guarantee integrity
    await this.prisma.$transaction(async (tx) => {
      // 1. Log event for audit and replay
      const paymentEvent = await tx.paymentEvent.create({
        data: {
          eventType: event.type || 'unknown_event',
          payload: event,
        },
      });

      // 2. Handle payment intent succeeded
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data?.object;
        if (paymentIntent && paymentIntent.id) {
          // Find the payment record associated with this providerId
          const payment = await tx.payment.findFirst({
            where: { providerId: paymentIntent.id },
          });

          if (payment) {
            // Update payment status to paid
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'paid' },
            });

            // Update order status to paid
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: 'paid' },
            });

            // Log status change to order history
            await tx.orderStatusHistory.create({
              data: {
                orderId: payment.orderId,
                status: 'paid',
                note: `Payment verified via webhook event: ${paymentEvent.id}`,
              },
            });
          }
        }
      }
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    return { received: true };
  }
}
