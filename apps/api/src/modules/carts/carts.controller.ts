import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CartsService } from './carts.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { GuestSessionsService } from '../guest-sessions/guest-sessions.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../types/authenticated-request.interface';

@Controller('carts')
@UseGuards(SupabaseAuthGuard)
export class CartsController {
  constructor(
    private readonly cartsService: CartsService,
    private readonly guestSessionsService: GuestSessionsService,
  ) {}

  @Get()
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.cartsService.getCart(user.id);
  }

  @Get('reservation')
  getReservation(@CurrentUser() user: AuthenticatedUser) {
    return this.cartsService.getReservation(user.id);
  }

  @Get('wishlist')
  getWishlist(@CurrentUser() user: AuthenticatedUser) {
    return this.cartsService.getWishlist(user.id);
  }

  @Post('wishlist/items/:productId')
  addWishlistItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartsService.addWishlistItem(user.id, productId);
  }

  @Delete('wishlist/items/:productId')
  removeWishlistItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartsService.removeWishlistItem(user.id, productId);
  }

  @Post('merge-guest-session')
  @HttpCode(HttpStatus.OK)
  mergeGuestSession(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.guestSessionsService.mergeGuestSessionIntoAccount(user.id, req, res);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartsService.addItem(user.id, addToCartDto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(user.id, id, updateCartItemDto);
  }

  @Delete('items/:id')
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.cartsService.removeItem(user.id, id);
  }
}
