import { Controller, Post, Get, Body, Param, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    // req.user is populated by SupabaseAuthGuard
    // The user ID from Supabase is typically in the 'sub' claim
    const userId = req.user.sub;
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user.sub;
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.sub;
    return this.ordersService.getOrderById(id, userId);
  }
}
