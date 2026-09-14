import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  GuestSessionsService,
} from './guest-sessions.service';
import { AddGuestCartItemDto, UpdateGuestCartItemDto } from './dto/guest-cart.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../types/authenticated-request.interface';

/**
 * GuestSessionsController
 *
 * All guest endpoints are cookied — the session token is in an HttpOnly cookie,
 * never in a request body or query parameter.
 *
 * SECURITY: The session token from the cookie is ONLY used as a lookup key.
 * Cart data comes from the database, never from the client body.
 */
@Controller('guest')
export class GuestSessionsController {
  constructor(private readonly guestSessionsService: GuestSessionsService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Session Init
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Initialize or refresh a guest session.
   * Sets the HttpOnly gst cookie. Safe to call on every app load.
   */
  @Post('session')
  @HttpCode(HttpStatus.OK)
  async initSession(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.guestSessionsService.getOrCreateSession(req, res);
    return {
      isNew: result.isNew,
      // Never expose the session ID or token in the response body
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Guest Cart
  // ─────────────────────────────────────────────────────────────────────────

  @Get('cart')
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { sessionId } = await this.guestSessionsService.getOrCreateSession(req, res);
    return this.guestSessionsService.getGuestCart(sessionId);
  }

  @Post('cart/items')
  async addCartItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: AddGuestCartItemDto,
  ) {
    const { sessionId } = await this.guestSessionsService.getOrCreateSession(req, res);
    return this.guestSessionsService.addGuestCartItem(
      sessionId,
      dto.variantId,
      dto.quantity,
    );
  }

  @Patch('cart/items/:id')
  async updateCartItem(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGuestCartItemDto,
  ) {
    const sessionId = await this.guestSessionsService.resolveSession(req);
    if (!sessionId) return { items: [] };
    return this.guestSessionsService.updateGuestCartItem(sessionId, id, dto.quantity);
  }

  @Delete('cart/items/:id')
  async removeCartItem(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const sessionId = await this.guestSessionsService.resolveSession(req);
    if (!sessionId) return { items: [] };
    return this.guestSessionsService.removeGuestCartItem(sessionId, id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Guest Wishlist
  // ─────────────────────────────────────────────────────────────────────────

  @Get('wishlist')
  async getWishlist(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { sessionId } = await this.guestSessionsService.getOrCreateSession(req, res);
    return this.guestSessionsService.getGuestWishlist(sessionId);
  }

  @Post('wishlist/items/:productId')
  async addWishlistItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const { sessionId } = await this.guestSessionsService.getOrCreateSession(req, res);
    return this.guestSessionsService.addGuestWishlistItem(sessionId, productId);
  }

  @Delete('wishlist/items/:productId')
  async removeWishlistItem(
    @Req() req: Request,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    const sessionId = await this.guestSessionsService.resolveSession(req);
    if (!sessionId) return { items: [] };
    return this.guestSessionsService.removeGuestWishlistItem(sessionId, productId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Merge (called immediately after user logs in)
  // Protected: user must be authenticated. Reads guest data from the DB cookie.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Merge the guest session cart/wishlist into the authenticated user's account.
   *
   * SECURITY:
   * - Guest data is read from the DATABASE using the session token from the HttpOnly cookie.
   * - The request body contains NO cart items — no client-supplied data is trusted.
   * - The user identity comes from the verified JWT (SupabaseAuthGuard).
   */
  @Post('merge')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SupabaseAuthGuard)
  async mergeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.guestSessionsService.mergeGuestSessionIntoAccount(user.id, req, res);
  }
}
