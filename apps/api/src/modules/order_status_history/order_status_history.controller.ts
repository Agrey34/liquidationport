import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { OrderStatusHistoryService } from './order_status_history.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('order-status-history')
@UseGuards(SupabaseAuthGuard)
export class OrderStatusHistoryController {
  constructor(private readonly orderStatusHistoryService: OrderStatusHistoryService) {}

  @Get('order/:orderId')
  findByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string) {
    // In a real app, you should also verify the user owns the order or is an admin
    return this.orderStatusHistoryService.findByOrderId(orderId);
  }
}
