export interface PaymentIntentOptions {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  clientSecret: string;
  providerId: string;
}

export interface ParsedWebhookEvent {
  id: string;
  type: string;
  providerPaymentId?: string;
  status: 'succeeded' | 'failed' | 'other';
  amount?: number;
  rawPayload: any;
}

export interface IPaymentProvider {
  readonly name: string;
  createPaymentIntent(options: PaymentIntentOptions): Promise<PaymentIntentResult>;
  verifyWebhook(rawBody: Buffer | string | undefined, signature: string): Promise<ParsedWebhookEvent>;
}
