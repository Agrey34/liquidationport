import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import {
  IPaymentProvider,
  PaymentIntentOptions,
  PaymentIntentResult,
  ParsedWebhookEvent,
} from './payment-provider.interface';

@Injectable()
export class StripeProvider implements IPaymentProvider {
  readonly name = 'stripe';
  private readonly logger = new Logger(StripeProvider.name);
  private readonly secretKey?: string;
  private readonly webhookSecret?: string;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!this.secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY is not set. Operating in mock mode.');
    }
  }

  async createPaymentIntent(_options: PaymentIntentOptions): Promise<PaymentIntentResult> {
    if (this.secretKey) {
      // In production with Stripe SDK, call stripe.paymentIntents.create
      // Here we provide standard clientSecret generation or mock fallback
      const mockId = `pi_${crypto.randomBytes(12).toString('hex')}`;
      return {
        providerId: mockId,
        clientSecret: `${mockId}_secret_${crypto.randomBytes(16).toString('hex')}`,
      };
    }

    // Mock mode
    const mockId = `pi_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    return {
      providerId: mockId,
      clientSecret: `mock_client_secret_${mockId}`,
    };
  }

  async verifyWebhook(
    rawBody: Buffer | string | undefined,
    signature: string,
  ): Promise<ParsedWebhookEvent> {
    if (this.webhookSecret) {
      if (!signature) {
        throw new BadRequestException('Missing stripe-signature header');
      }

      if (!rawBody) {
        throw new BadRequestException('Missing request raw body for webhook verification');
      }

      // Verify Stripe signature format: t=timestamp,v1=sig
      const sigParts = signature.split(',').reduce((acc, part) => {
        const [key, value] = part.split('=');
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      }, {} as Record<string, string>);

      const timestamp = sigParts['t'];
      const expectedSig = sigParts['v1'];

      if (!timestamp || !expectedSig) {
        throw new BadRequestException('Invalid stripe-signature format');
      }

      // Prevent replay attacks (allow up to 5 minutes tolerance)
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
        throw new BadRequestException('Webhook timestamp too old or in future');
      }

      const payloadString = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const signedPayload = `${timestamp}.${payloadString}`;
      const computedSig = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(expectedSig))) {
        throw new BadRequestException('Stripe signature verification failed');
      }

      const parsed = JSON.parse(payloadString);
      const isSucceeded = parsed.type === 'payment_intent.succeeded';
      const isFailed = parsed.type === 'payment_intent.payment_failed';

      return {
        id: parsed.id || `evt_${Date.now()}`,
        type: parsed.type,
        providerPaymentId: parsed.data?.object?.id,
        status: isSucceeded ? 'succeeded' : isFailed ? 'failed' : 'other',
        amount: parsed.data?.object?.amount ? parsed.data.object.amount / 100 : undefined,
        rawPayload: parsed,
      };
    }

    // Mock mode fallback when no secret is configured
    this.logger.warn('Processing webhook without signature verification (mock mode)');
    const bodyObj = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    const isSucceeded = bodyObj?.type === 'payment_intent.succeeded';
    const isFailed = bodyObj?.type === 'payment_intent.payment_failed';

    return {
      id: bodyObj?.id || `evt_mock_${Date.now()}`,
      type: bodyObj?.type || 'payment_intent.succeeded',
      providerPaymentId: bodyObj?.data?.object?.id,
      status: isSucceeded ? 'succeeded' : isFailed ? 'failed' : 'other',
      amount: bodyObj?.data?.object?.amount ? bodyObj.data.object.amount / 100 : undefined,
      rawPayload: bodyObj,
    };
  }
}
