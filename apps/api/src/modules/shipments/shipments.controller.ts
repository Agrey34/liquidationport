import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';
import { CreateShipmentDto, UpdateShipmentDto } from './dto/shipment.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createShipmentDto: CreateShipmentDto) {
    return this.shipmentsService.create(createShipmentDto);
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('order/:orderId')
  findOneByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.shipmentsService.findOneByOrder(orderId);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateShipmentDto: UpdateShipmentDto,
  ) {
    return this.shipmentsService.update(id, updateShipmentDto);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/deliver')
  markAsDelivered(@Param('id', ParseUUIDPipe) id: string) {
    return this.shipmentsService.markAsDelivered(id);
  }
}
