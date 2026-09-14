import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Headers,
  HttpCode,
  RawBodyRequest,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentDto } from './dto/payment.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../types/authenticated-request.interface';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(SupabaseAuthGuard)
  @Post('intent')
  createIntent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(user.id, createPaymentIntentDto);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req, signature);
  }
}
