import { Controller, Post, Body, Req, UseGuards, Headers, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/payment.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Request } from 'express';

@Controller('v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('intent')
  createIntent(@Req() req, @Body() createPaymentIntentDto: CreatePaymentIntentDto) {
    return this.paymentsService.createPaymentIntent(req.user.id, createPaymentIntentDto);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    // In NestJS, you might need to use raw body parsing for Stripe Webhooks
    return this.paymentsService.handleWebhook(req, signature);
  }
}
