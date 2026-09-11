import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AddToCartDto, UpdateCartItemDto, MergeGuestSessionDto } from './dto/cart.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';

@Controller('carts')
@UseGuards(SupabaseAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  getCart(@Req() req) {
    return this.cartsService.getCart(req.user.id);
  }

  @Get('reservation')
  getReservation(@Req() req) {
    return this.cartsService.getReservation(req.user.id);
  }

  @Get('wishlist')
  getWishlist(@Req() req) {
    return this.cartsService.getWishlist(req.user.id);
  }

  @Post('wishlist/items/:productId')
  addWishlistItem(@Req() req, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.cartsService.addWishlistItem(req.user.id, productId);
  }

  @Delete('wishlist/items/:productId')
  removeWishlistItem(@Req() req, @Param('productId', ParseUUIDPipe) productId: string) {
    return this.cartsService.removeWishlistItem(req.user.id, productId);
  }

  @Post('merge-guest-session')
  @HttpCode(HttpStatus.OK)
  mergeGuestSession(@Req() req, @Body() dto: MergeGuestSessionDto) {
    return this.cartsService.mergeGuestSession(req.user.id, dto);
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
