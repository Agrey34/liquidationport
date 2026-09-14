import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from '../../database/database.module';
import { StripeProvider } from './providers/stripe.provider';

@Module({
  imports: [DatabaseModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
