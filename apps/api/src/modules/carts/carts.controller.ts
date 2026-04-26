import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('v1/carts')
@UseGuards(SupabaseAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartsService.getCart(req.user.id);
  }

  @Post('items')
  addItem(@Req() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartsService.addItem(req.user.id, addToCartDto);
  }

  @Patch('items/:id')
  updateItem(
    @Req() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(req.user.id, id, updateCartItemDto);
  }

  @Delete('items/:id')
  removeItem(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.cartsService.removeItem(req.user.id, id);
  }
}
