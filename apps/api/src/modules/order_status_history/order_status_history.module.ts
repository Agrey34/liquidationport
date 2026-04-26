import { Module } from '@nestjs/common';
import { OrderStatusHistoryService } from './order_status_history.service';
import { OrderStatusHistoryController } from './order_status_history.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderStatusHistoryController],
  providers: [OrderStatusHistoryService],
  exports: [OrderStatusHistoryService],
})
export class OrderStatusHistoryModule {}
