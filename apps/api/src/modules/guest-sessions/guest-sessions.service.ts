import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

/** Name of the HttpOnly cookie that stores the raw guest session token */
export const GUEST_SESSION_COOKIE = 'gst';

/** Guest session TTL: 30 days */
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Maximum number of items in a guest cart */
const MAX_GUEST_CART_ITEMS = 20;

/**
 * GuestSessionsService
 *
 * Manages server-backed guest sessions stored in the database.
 * Guest cart and wishlist state is NEVER stored in localStorage or
 * readable JS cookies — only an opaque token is stored in an HttpOnly cookie.
 *
 * Security properties:
 * - Raw token is 32 bytes of cryptographically random data (CSPRNG)
 * - Only a SHA-256 hash of the token is stored in the database
 * - A database breach cannot be used to forge session tokens
 * - The cookie is HttpOnly, SameSite=Lax, Secure in production
 */
@Injectable()
export class GuestSessionsService {
  private readonly logger = new Logger(GuestSessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Session Management
  // ─────────────────────────────────────────────────────────────────────────

  /** Hash the raw token for database storage */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Generate a new CSPRNG token and return both the raw token and its hash */
  private generateToken(): { raw: string; hash: string } {
    const raw = crypto.randomBytes(32).toString('hex');
    return { raw, hash: this.hashToken(raw) };
  }

  /** Set the guest session HttpOnly cookie on the response */
  setSessionCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(GUEST_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });
  }

  /** Clear the guest session cookie */
  clearSessionCookie(res: Response): void {
    res.clearCookie(GUEST_SESSION_COOKIE, { path: '/' });
  }

  /** Extract the raw token from the request cookie */
  extractTokenFromRequest(req: Request): string | null {
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const token = cookies?.[GUEST_SESSION_COOKIE];
    if (typeof token === 'string' && token.length > 0) {
      return token;
    }

    // Fallback: parse raw Cookie header if req.cookies is not pre-parsed
    const rawCookie = req.headers?.cookie;
    if (typeof rawCookie === 'string') {
      const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${GUEST_SESSION_COOKIE}=([^;]+)`));
      if (match && match[1]) {
        return decodeURIComponent(match[1].trim());
      }
    }

    return null;
  }

  /**
   * Get an existing session by token, or create a new one.
   * Also refreshes the cookie TTL on each visit.
   */
  async getOrCreateSession(
    req: Request,
    res: Response,
  ): Promise<{ sessionId: string; token: string; isNew: boolean }> {
    const rawToken = this.extractTokenFromRequest(req);

    if (rawToken) {
      const tokenHash = this.hashToken(rawToken);
      const existing = await this.prisma.guestSession.findUnique({
        where: { tokenHash },
        select: { id: true, expiresAt: true },
      });

      if (existing && existing.expiresAt > new Date()) {
        // Refresh expiry and last-seen timestamp
        await this.prisma.guestSession.update({
          where: { tokenHash },
          data: {
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
            lastSeenAt: new Date(),
          },
        });
        // Refresh cookie TTL
        this.setSessionCookie(res, rawToken);
        return { sessionId: existing.id, token: rawToken, isNew: false };
      }
    }

    // Create a new session
    const { raw, hash } = this.generateToken();
    const session = await this.prisma.guestSession.create({
      data: {
        tokenHash: hash,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
      select: { id: true },
    });

    this.setSessionCookie(res, raw);
    return { sessionId: session.id, token: raw, isNew: true };
  }

  /**
   * Resolve a session ID from the request cookie (read-only, no creation).
   * Returns null if the session doesn't exist or has expired.
   */
  async resolveSession(req: Request): Promise<string | null> {
    const rawToken = this.extractTokenFromRequest(req);
    if (!rawToken) return null;

    const tokenHash = this.hashToken(rawToken);
    const session = await this.prisma.guestSession.findUnique({
      where: { tokenHash },
      select: { id: true, expiresAt: true },
    });

    if (!session || session.expiresAt <= new Date()) return null;
    return session.id;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Guest Cart Operations
  // ─────────────────────────────────────────────────────────────────────────

  /** Get or create the guest cart for a session */
  private async getOrCreateCart(sessionId: string) {
    const existing = await this.prisma.guestCart.findUnique({
      where: { guestSessionId: sessionId },
      select: { id: true },
    });

    if (existing) return existing;

    return this.prisma.guestCart.create({
      data: { guestSessionId: sessionId },
      select: { id: true },
    });
  }

  /** Get the full guest cart with variant + product data */
  async getGuestCart(sessionId: string) {
    const cart = await this.prisma.guestCart.findUnique({
      where: { guestSessionId: sessionId },
      include: {
        items: {
          include: {
            variant: {
              select: {
                id: true,
                sku: true,
                price: true,
                stock: true,
                condition: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    status: true,
                    media: { take: 1, select: { url: true } },
                  },
                },
              },
            },
          },
          orderBy: { addedAt: 'asc' },
        },
      },
    });

    if (!cart) return { items: [] };

    const items = cart.items
      .filter(
        (item) =>
          item.variant.product.status === 'Active' &&
          item.variant.stock > 0,
      )
      .map((item) => ({
        id: item.id,
        variantId: item.variant.id,
        productId: item.variant.product.id,
        title: item.variant.product.name,
        slug: item.variant.product.slug,
        sku: item.variant.sku,
        price: Number(item.variant.price),
        quantity: item.quantity,
        maxQuantity: item.variant.stock,
        img: item.variant.product.media[0]?.url ?? '',
        condition: item.variant.condition,
      }));

    return { items };
  }

  /** Add or increment an item in the guest cart */
  async addGuestCartItem(
    sessionId: string,
    variantId: string,
    quantity: number,
  ) {
    // Validate variant exists and has sufficient stock
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, stock: true, product: { select: { status: true } } },
    });

    if (!variant) throw new NotFoundException('Product variant not found');
    if (variant.product.status !== 'Active') {
      throw new BadRequestException('This product is no longer available');
    }

    const cart = await this.getOrCreateCart(sessionId);

    // Check item count limit
    const itemCount = await this.prisma.guestCartItem.count({
      where: { guestCartId: cart.id },
    });
    if (itemCount >= MAX_GUEST_CART_ITEMS) {
      throw new BadRequestException(
        `Guest cart is limited to ${MAX_GUEST_CART_ITEMS} items`,
      );
    }

    // Upsert: increment quantity if item already exists
    const existing = await this.prisma.guestCartItem.findUnique({
      where: { guestCartId_variantId: { guestCartId: cart.id, variantId } },
      select: { id: true, quantity: true },
    });

    const newQuantity = existing
      ? Math.min(existing.quantity + quantity, variant.stock)
      : Math.min(quantity, variant.stock);

    if (newQuantity <= 0) {
      throw new BadRequestException('Insufficient stock');
    }

    if (existing) {
      await this.prisma.guestCartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
      });
    } else {
      await this.prisma.guestCartItem.create({
        data: { guestCartId: cart.id, variantId, quantity: newQuantity },
      });
    }

    return this.getGuestCart(sessionId);
  }

  /** Update quantity of a specific guest cart item */
  async updateGuestCartItem(
    sessionId: string,
    itemId: string,
    quantity: number,
  ) {
    const item = await this.prisma.guestCartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { guestSessionId: true } },
        variant: { select: { stock: true } },
      },
    });

    // IDOR protection: ensure item belongs to this session
    if (!item || item.cart.guestSessionId !== sessionId) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity <= 0) {
      await this.prisma.guestCartItem.delete({ where: { id: itemId } });
    } else {
      const safeQty = Math.min(quantity, item.variant.stock);
      await this.prisma.guestCartItem.update({
        where: { id: itemId },
        data: { quantity: safeQty },
      });
    }

    return this.getGuestCart(sessionId);
  }

  /** Remove a specific guest cart item */
  async removeGuestCartItem(sessionId: string, itemId: string) {
    const item = await this.prisma.guestCartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { guestSessionId: true } } },
    });

    // IDOR protection
    if (!item || item.cart.guestSessionId !== sessionId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.guestCartItem.delete({ where: { id: itemId } });
    return this.getGuestCart(sessionId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Guest Wishlist Operations
  // ─────────────────────────────────────────────────────────────────────────

  private async getOrCreateWishlist(sessionId: string) {
    const existing = await this.prisma.guestWishlist.findUnique({
      where: { guestSessionId: sessionId },
      select: { id: true },
    });
    if (existing) return existing;
    return this.prisma.guestWishlist.create({
      data: { guestSessionId: sessionId },
      select: { id: true },
    });
  }

  async getGuestWishlist(sessionId: string) {
    const wishlist = await this.prisma.guestWishlist.findUnique({
      where: { guestSessionId: sessionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                condition: true,
                status: true,
                media: { take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    });

    if (!wishlist) return { items: [] };

    return {
      items: wishlist.items
        .filter((item) => item.product.status === 'Active')
        .map((item) => ({
          id: item.product.id,
          title: item.product.name,
          slug: item.product.slug,
          price: Number(item.product.price),
          img: item.product.media[0]?.url ?? '',
          condition: item.product.condition,
        })),
    };
  }

  async addGuestWishlistItem(sessionId: string, productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'Active') {
      throw new BadRequestException('Product is not available');
    }

    const wishlist = await this.getOrCreateWishlist(sessionId);

    try {
      await this.prisma.guestWishlistItem.create({
        data: { guestWishlistId: wishlist.id, productId },
      });
    } catch {
      // Unique constraint violation means item already in wishlist — idempotent
    }

    return this.getGuestWishlist(sessionId);
  }

  async removeGuestWishlistItem(sessionId: string, productId: string) {
    const wishlist = await this.prisma.guestWishlist.findUnique({
      where: { guestSessionId: sessionId },
      select: { id: true },
    });

    if (wishlist) {
      await this.prisma.guestWishlistItem.deleteMany({
        where: { guestWishlistId: wishlist.id, productId },
      });
    }

    return this.getGuestWishlist(sessionId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Merge: Guest → Authenticated Account
  // Called after a user logs in. Reads from DB (not client body).
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Merges a guest session's cart and wishlist into the authenticated user's account.
   * Data comes from the database (via session token), NEVER from the request body.
   *
   * @param userId - The authenticated user's ID (from verified JWT)
   * @param req - Express request to read the guest session cookie
   * @param res - Express response to clear the guest cookie after merge
   */
  async mergeGuestSessionIntoAccount(
    userId: string,
    req: Request,
    res: Response,
  ): Promise<{
    success: boolean;
    mergedCartItems: number;
    mergedWishlistItems: number;
    warnings: string[];
  }> {
    const sessionId = await this.resolveSession(req);
    if (!sessionId) {
      return {
        success: true,
        mergedCartItems: 0,
        mergedWishlistItems: 0,
        warnings: [],
      };
    }

    const warnings: string[] = [];
    let mergedCartItems = 0;
    let mergedWishlistItems = 0;

    // ── 1. Merge cart ──────────────────────────────────────────────────────
    const guestCart = await this.prisma.guestCart.findUnique({
      where: { guestSessionId: sessionId },
      include: {
        items: {
          include: { variant: { select: { id: true, stock: true } } },
        },
      },
    });

    if (guestCart && guestCart.items.length > 0) {
      // Get or create the user's authenticated cart
      const userCart = await this.prisma.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });

      for (const guestItem of guestCart.items) {
        const availableStock = guestItem.variant.stock;
        if (availableStock <= 0) {
          warnings.push(
            `One item was out of stock and could not be added to your cart`,
          );
          continue;
        }

        const quantityToMerge = Math.min(guestItem.quantity, availableStock);

        try {
          const existingCartItem = await this.prisma.cartItem.findUnique({
            where: {
              cartId_variantId: {
                cartId: userCart.id,
                variantId: guestItem.variantId,
              },
            },
            select: { id: true, quantity: true },
          });

          if (existingCartItem) {
            const mergedQty = Math.min(
              existingCartItem.quantity + quantityToMerge,
              availableStock,
            );
            await this.prisma.cartItem.update({
              where: { id: existingCartItem.id },
              data: { quantity: mergedQty },
            });
          } else {
            await this.prisma.cartItem.create({
              data: {
                cartId: userCart.id,
                variantId: guestItem.variantId,
                quantity: quantityToMerge,
              },
            });
          }
          mergedCartItems++;
        } catch (err: unknown) {
          this.logger.warn(
            `Failed to merge guest cart item ${guestItem.id}: ${String(err)}`,
          );
          warnings.push('Some cart items could not be transferred');
        }
      }
    }

    // ── 2. Merge wishlist ──────────────────────────────────────────────────
    const guestWishlist = await this.prisma.guestWishlist.findUnique({
      where: { guestSessionId: sessionId },
      include: { items: { select: { productId: true } } },
    });

    if (guestWishlist && guestWishlist.items.length > 0) {
      const userWishlist = await this.prisma.wishlist.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      });

      for (const guestItem of guestWishlist.items) {
        try {
          await this.prisma.wishlistItem.upsert({
            where: {
              wishlistId_productId: {
                wishlistId: userWishlist.id,
                productId: guestItem.productId,
              },
            },
            create: {
              wishlistId: userWishlist.id,
              productId: guestItem.productId,
            },
            update: {},
          });
          mergedWishlistItems++;
        } catch {
          // Ignore if already in wishlist
        }
      }
    }

    // ── 3. Invalidate and delete the guest session ─────────────────────────
    try {
      await this.prisma.guestSession.delete({
        where: { id: sessionId },
      });
    } catch {
      // Best-effort cleanup
    }

    this.clearSessionCookie(res);

    return { success: true, mergedCartItems, mergedWishlistItems, warnings };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cleanup (called by scheduled task)
  // ─────────────────────────────────────────────────────────────────────────

  async deleteExpiredSessions(): Promise<number> {
    const result = await this.prisma.guestSession.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
