import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Req,
  Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, AuthenticatedRequest } from '../../types/authenticated-request.interface';

@Controller('orders')
@UseGuards(SupabaseAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createOrderDto: CreateOrderDto,
    @Headers('x-idempotency-key') xIdempotencyKey?: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const key = xIdempotencyKey || idempotencyKey;
    return this.ordersService.createOrder(user.id, createOrderDto, key);
  }

  /** Admin order list — must be registered before :id to avoid route collision */
  @Get('admin')
  async findAdminOrders(
    @Req() req: AuthenticatedRequest,
    @Query() query: OrderQueryDto,
  ) {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? req.requestId;
    return this.ordersService.getAdminOrders(query, requestId);
  }

  /** Admin: get a single order by ID with full details */
  @Get('admin/:id')
  async findOneAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderByIdAdmin(id);
  }

  /** Admin: update order status */
  @Patch('admin/:id')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.note,
      user,
    );
  }

  /** Customer: list own orders */
  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.getUserOrders(user.id);
  }

  /** Customer: get own order by ID (IDOR-safe — service checks ownership) */
  @Get(':id')
  async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getOrderById(id, user.id);
  }
}
