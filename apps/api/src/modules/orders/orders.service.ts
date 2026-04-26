import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new order using a secure Prisma transaction.
   * Validates stock availability, snapshots prices, and reserves inventory.
   */
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Extract all variant IDs requested
    const variantIds = items.map((item) => item.variantId);

    // Execute the transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch all variants with their inventory and product details
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { 
          inventory: true,
          product: { select: { name: true } }
        },
      });

      // Ensure all requested variants exist
      if (variants.length !== variantIds.length) {
         const foundIds = variants.map(v => v.id);
         const missingIds = variantIds.filter(id => !foundIds.includes(id));
         throw new NotFoundException(`Variants not found: ${missingIds.join(', ')}`);
      }

      let orderTotal = 0;
      const orderItemsData = [];

      // 2. Validate stock and prepare order items
      for (const item of items) {
        const variant = variants.find((v) => v.id === item.variantId);
        
        if (!variant.inventory) {
           throw new BadRequestException(`Inventory tracking missing for variant ${variant.sku}`);
        }

        const availableStock = variant.inventory.quantity - variant.inventory.reserved;

        if (availableStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for ${variant.product.name} (SKU: ${variant.sku}). Available: ${availableStock}, Requested: ${item.quantity}`
          );
        }

        // Calculate item total based on DB price (Snapshotting price)
        const itemTotal = Number(variant.price) * item.quantity;
        orderTotal += itemTotal;

        orderItemsData.push({
          variantId: variant.id,
          productName: variant.product.name,
          sku: variant.sku,
          quantity: item.quantity,
          price: variant.price, // SNAPSHOT the price here
        });

        // 3. Reserve the inventory
        await tx.inventory.update({
          where: { id: variant.inventory.id },
          data: {
            reserved: { increment: item.quantity },
          },
        });
      }

      // 4. Create the Order
      const order = await tx.order.create({
        data: {
          userId,
          total: orderTotal,
          status: OrderStatus.pending,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: [
              {
                status: OrderStatus.pending,
                note: 'Order created via checkout',
              }
            ]
          }
        },
        include: {
          items: true,
        }
      });

      this.logger.log(`Order ${order.id} created successfully for user ${userId}`);

      return order;
    });
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        statusHistory: true,
        payment: true,
        shipment: true,
      }
    });
  }

  async getOrderById(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: true,
        payment: true,
        shipment: true,
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Ensure the user can only fetch their own order, unless they are an admin
    // For now, we strictly check ownership
    if (order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`); // Disguise unauthorized as not found
    }

    return order;
  }
}
