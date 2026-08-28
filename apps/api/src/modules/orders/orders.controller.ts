import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    const userId = req.user.id;
    return this.ordersService.createOrder(userId, createOrderDto);
  }

  // Admin order query endpoint (MUST come before :id route)
  @Get('admin')
  async findAdminOrders(@Request() req: any, @Query() query: OrderQueryDto) {
    const requestId = req?.headers?.['x-request-id'] || req?.['requestId'];
    return this.ordersService.getAdminOrders(query, requestId);
  }

  // Admin single order detailed query endpoint
  @Get('admin/:id')
  async findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderByIdAdmin(id);
  }

  // Admin order status update endpoint
  @Patch('admin/:id')
  async updateStatus(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.note,
      req.user,
    );
  }

  @Get()
  async findAll(@Request() req: any) {
    const userId = req.user.id;
    return this.ordersService.getUserOrders(userId);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.ordersService.getOrderById(id, userId);
  }
}

