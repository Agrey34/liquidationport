import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
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
                include: { product: true },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(userId: string, addToCartDto: AddToCartDto) {
    const cart = await this.getCart(userId);
    const quantity = Number(addToCartDto.quantity);

    // Check variant exists and has stock
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: addToCartDto.variantId },
    });

    if (!variant) throw new NotFoundException('Product variant not found');
    if (variant.stock < quantity) throw new BadRequestException('Not enough stock available');

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: variant.id,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      if (variant.stock < newQuantity) throw new BadRequestException('Not enough stock available');
      
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    }

    // Add new item
    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: variant.id,
        quantity,
      },
    });
  }

  async updateItem(userId: string, itemId: string, updateDto: UpdateCartItemDto) {
    const cart = await this.getCart(userId);
    
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { variant: true },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found in your cart');
    }

    if (cartItem.variant.stock < updateDto.quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateDto.quantity },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getCart(userId);
    
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!cartItem || cartItem.cartId !== cart.id) {
      throw new NotFoundException('Cart item not found in your cart');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }
}
