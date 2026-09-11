import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto, MergeGuestSessionDto } from './dto/cart.dto';
import * as crypto from 'crypto';

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: { include: { media: { take: 1 } } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: { include: { media: { take: 1 } } } },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const quantity = Number(addToCartDto.quantity);

    // 1. Single-query lookup supporting either variant ID or product ID
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        OR: [
          { id: addToCartDto.variantId },
          { productId: addToCartDto.variantId },
        ],
      },
      select: { id: true, stock: true },
    });

    if (!variant) throw new NotFoundException('Product variant not found');
    if (variant.stock < quantity) throw new BadRequestException('Not enough stock available');

    // 2. Ensure user cart exists
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    // 3. Check existing item in cart
    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      select: { quantity: true },
    });

    if (variant.stock < (existing?.quantity ?? 0) + quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    // 4. Atomic upsert for cartItem
    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId: variant.id } },
      create: { cartId: cart.id, variantId: variant.id, quantity },
      update: { quantity: { increment: quantity } },
    });

    // 5. Return fresh cart directly to save extra roundtrip from frontend
    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, updateDto: UpdateCartItemDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException('Cart not found');
    
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      select: { id: true, cartId: true, variant: { select: { stock: true } } },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found in your cart');
    }

    if (cartItem.variant.stock < updateDto.quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateDto.quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!cart) throw new NotFoundException('Cart not found');

    // Scope deletion to the authenticated user's cart.
    const result = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    if (result.count !== 1) throw new NotFoundException('Cart item not found in your cart');

    return this.getCart(userId);
  }

  async getWishlist(userId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { media: { take: 1 } } } } } },
    });
    return wishlist?.items ?? [];
  }

  async addWishlistItem(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, deletedAt: null }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found');
    return this.prisma.$transaction(async (tx) => {
      const wishlist = await tx.wishlist.upsert({ where: { userId }, create: { userId }, update: {} });
      return tx.wishlistItem.upsert({
        where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
        create: { wishlistId: wishlist.id, productId },
        update: {},
      });
    }, { maxWait: 5000, timeout: 15000 });
  }

  async removeWishlistItem(userId: string, productId: string) {
    const wishlist = await this.prisma.wishlist.findUnique({ where: { userId }, select: { id: true } });
    if (!wishlist) return { deleted: false };
    const result = await this.prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
    return { deleted: result.count === 1 };
  }

  async getReservation(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { reservedUntil: true, reservationToken: true },
    });

    if (!cart || !cart.reservedUntil) {
      return { hasActiveReservation: false, remainingSeconds: 0, reservedUntil: null };
    }

    const now = new Date();
    const remainingMs = cart.reservedUntil.getTime() - now.getTime();
    if (remainingMs <= 0) {
      return { hasActiveReservation: false, remainingSeconds: 0, reservedUntil: cart.reservedUntil.toISOString() };
    }

    return {
      hasActiveReservation: true,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      reservedUntil: cart.reservedUntil.toISOString(),
      reservationToken: cart.reservationToken,
    };
  }

  async mergeGuestSession(userId: string, dto: MergeGuestSessionDto) {
    // 1. Sync / Merge Wishlist outside the critical inventory lock to reduce transaction duration
    if (dto.guestProductIds && dto.guestProductIds.length > 0) {
      try {
        let wishlist = await this.prisma.wishlist.findUnique({ where: { userId } });
        if (!wishlist) {
          wishlist = await this.prisma.wishlist.create({ data: { userId } });
        }

        const validProducts = await this.prisma.product.findMany({
          where: { id: { in: dto.guestProductIds }, deletedAt: null },
          select: { id: true },
        });

        if (validProducts.length > 0) {
          await this.prisma.wishlistItem.createMany({
            data: validProducts.map((p) => ({
              wishlistId: wishlist.id,
              productId: p.id,
            })),
            skipDuplicates: true,
          });
        }
      } catch (wishlistErr) {
        this.logger.warn(`Non-blocking wishlist sync notice for user ${userId}: ${wishlistErr}`);
      }
    }

    // 2. Transactional Cart & Inventory Hold Synchronization with extended timeout threshold
    return this.prisma.$transaction(
      async (tx) => {
        // 2a. Ensure User exists
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User profile not found in database');
        }

        // 2b. Retrieve or initialize user cart
        const cart = await tx.cart.upsert({
          where: { userId },
          create: { userId },
          update: {},
          include: { items: true },
        });

        const mergedItemMap = new Map<string, number>();
        for (const item of cart.items) {
          mergedItemMap.set(item.variantId, item.quantity);
        }

        if (dto.guestCart && dto.guestCart.length > 0) {
          for (const guestItem of dto.guestCart) {
            const current = mergedItemMap.get(guestItem.variantId) || 0;
            mergedItemMap.set(guestItem.variantId, Math.max(current, Number(guestItem.quantity)));
          }
        }

        const keys = Array.from(mergedItemMap.keys());
        const warnings: string[] = [];
        const finalItemsToReserve: { variantId: string; quantity: number }[] = [];
        const now = new Date();
        const holdExpiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15-minute hold

        if (keys.length > 0) {
          // Consolidated batch query: fetch all variants matching either variantId or productId in ONE round-trip
          const variants = await tx.productVariant.findMany({
            where: {
              OR: [
                { id: { in: keys } },
                { productId: { in: keys } },
              ],
              product: { deletedAt: null },
            },
            include: {
              inventory: true,
              product: true,
            },
          });

          const inventoryUpdates: Promise<unknown>[] = [];

          for (const [key, requestedQty] of mergedItemMap.entries()) {
            const variant = variants.find((v) => v.id === key || v.productId === key);

            if (!variant || variant.product.deletedAt) {
              warnings.push('Item is no longer available.');
              continue;
            }

            const totalStock = variant.inventory?.quantity ?? variant.stock ?? 0;
            const reservedStock = variant.inventory?.reserved ?? 0;
            const availableStock = Math.max(0, totalStock - reservedStock);

            if (availableStock <= 0) {
              warnings.push(`Pallet "${variant.product.name}" is sold out.`);
              continue;
            }

            const grantedQty = Math.min(requestedQty, availableStock);
            if (grantedQty < requestedQty) {
              warnings.push(`Only ${grantedQty} pallet(s) remaining for "${variant.product.name}". Quantity adjusted.`);
            }

            finalItemsToReserve.push({ variantId: variant.id, quantity: grantedQty });

            if (variant.inventory) {
              inventoryUpdates.push(
                tx.inventory.update({
                  where: { id: variant.inventory.id },
                  data: {
                    reserved: { increment: grantedQty },
                  },
                })
              );
            }
          }

          // Execute all inventory reservation updates in parallel
          if (inventoryUpdates.length > 0) {
            await Promise.all(inventoryUpdates);
          }
        }

        // 2c. Remove stale items, then use the composite key to update/create each
        // remaining item atomically. This avoids unique-key races during repeated sign-ins.
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, variantId: { notIn: finalItemsToReserve.map((item) => item.variantId) } },
        });

        if (finalItemsToReserve.length > 0) {
          await Promise.all(finalItemsToReserve.map((item) => tx.cartItem.upsert({
            where: { cartId_variantId: { cartId: cart.id, variantId: item.variantId } },
            create: { cartId: cart.id, variantId: item.variantId, quantity: item.quantity },
            update: { quantity: { set: item.quantity } },
          })));

          await tx.cart.update({
            where: { id: cart.id },
            data: {
              reservedUntil: holdExpiresAt,
              reservationToken: crypto.randomUUID(),
            },
          });
        } else {
          await tx.cart.update({
            where: { id: cart.id },
            data: {
              reservedUntil: null,
              reservationToken: null,
            },
          });
        }

        // 2d. Fetch populated merged cart snapshot
        const updatedCart = await tx.cart.findUnique({
          where: { id: cart.id },
          include: {
            items: {
              include: {
                variant: {
                  include: { product: { include: { media: { take: 1 } } } },
                },
              },
            },
          },
        });

        return {
          success: true,
          holdExpiresInSeconds: finalItemsToReserve.length > 0 ? 900 : 0,
          reservedUntil: finalItemsToReserve.length > 0 ? holdExpiresAt.toISOString() : null,
          warnings,
          mergedCart: updatedCart?.items.map((i) => ({
            id: i.variantId,
            productId: i.variant.productId,
            title: i.variant.product.name,
            price: Number(i.variant.price),
            qty: i.quantity,
            sku: i.variant.sku,
            img: i.variant.product.media?.[0]?.url || '',
            slug: i.variant.product.slug,
            condition: i.variant.condition || i.variant.product.condition,
          })) || [],
        };
      },
      {
        maxWait: 5000,
        timeout: 15000,
      }
    );
  }
}
