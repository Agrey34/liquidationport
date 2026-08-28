import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

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
    }, {
      maxWait: 15000,
      timeout: 20000,
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
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payment: true,
        shipment: true,
        user: {
          select: {
            id: true,
            email: true,
            addresses: true,
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Ensure the user can only fetch their own order, unless they are an admin
    if (order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  // ==========================================
  // ADMIN ORDER MANAGEMENT (PERFORMANCE-OPTIMIZED)
  // ==========================================

  async getAdminOrders(
    query: {
      search?: string;
      status?: string;
      paymentStatus?: string;
      sortBy?: string;
      sortDir?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
    requestId?: string
  ) {
    const t0 = performance.now();
    const reqId = requestId || crypto.randomUUID().slice(0, 8);

    const {
      search,
      status,
      paymentStatus,
      sortBy = 'createdAt',
      sortDir = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    // Construct Prisma Where Input
    const where: any = {};

    // 1. Search Query
    if (search && search.trim()) {
      const q = search.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(q);
      
      if (isUuid) {
        where.id = q;
      } else {
        where.OR = [
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { items: { some: { productName: { contains: q, mode: 'insensitive' } } } },
          { items: { some: { sku: { contains: q, mode: 'insensitive' } } } },
        ];
      }
    }

    // 2. Status Filter
    if (status && status !== 'all') {
      if (status === 'attention') {
        where.OR = [
          { payment: { status: PaymentStatus.failed } },
          { status: OrderStatus.pending, payment: { status: PaymentStatus.paid } },
        ];
      } else if (Object.values(OrderStatus).includes(status as OrderStatus)) {
        where.status = status as OrderStatus;
      }
    }

    // 3. Payment Status Filter
    if (paymentStatus && paymentStatus !== 'All' && paymentStatus !== 'all') {
      where.payment = { status: paymentStatus as PaymentStatus };
    }

    // Dynamic sorting
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'total') {
      orderBy = { total: sortDir === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'status') {
      orderBy = { status: sortDir === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'id') {
      orderBy = { id: sortDir === 'asc' ? 'asc' : 'desc' };
    } else {
      orderBy = { createdAt: sortDir === 'asc' ? 'asc' : 'desc' };
    }

    // Execute optimized queries in parallel without blocking transactions
    const tDbStart = performance.now();
    const [rawOrders, total, kpiRows] = await Promise.all([
      // 1. Paginated Orders with lean select (only required columns, single address)
      this.prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: safeLimit,
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          items: {
            select: {
              id: true,
              productName: true,
              sku: true,
              quantity: true,
              price: true,
            }
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              status: true,
              note: true,
              createdAt: true,
            }
          },
          payment: {
            select: {
              status: true,
              provider: true,
            }
          },
          shipment: {
            select: {
              tracking: true,
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              addresses: {
                take: 1,
                select: {
                  addressLine: true,
                  city: true,
                  country: true,
                  postalCode: true,
                }
              }
            }
          }
        }
      }),
      // 2. Filtered total count for pagination metadata
      this.prisma.order.count({ where }),
      // 3. Platform consolidated KPI metrics (computed in a single database round-trip)
      this.prisma.$queryRaw<Array<{
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: number;
        attentionRequired: number;
      }>>`
        SELECT 
          COUNT(DISTINCT o.id)::int AS "totalOrders",
          COUNT(DISTINCT o.id) FILTER (WHERE o.status = 'pending')::int AS "pendingOrders",
          COALESCE(SUM(DISTINCT o.total) FILTER (WHERE o.status != 'cancelled'), 0)::float AS "totalRevenue",
          COUNT(DISTINCT o.id) FILTER (
            WHERE o.status = 'pending' 
            OR p.status = 'failed'
          )::int AS "attentionRequired"
        FROM "orders" o
        LEFT JOIN "payments" p ON p.order_id = o.id;
      `
    ]);
    const dbDuration = performance.now() - tDbStart;

    const kpiData = kpiRows?.[0] || {
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
      attentionRequired: 0,
    };

    // Map raw orders to comprehensive AppOrder format for the frontend
    const tMapStart = performance.now();
    const mappedOrders = rawOrders.map((order) => {
      const primaryAddress = order.user?.addresses?.[0];
      const addressString = primaryAddress
        ? `${primaryAddress.addressLine}, ${primaryAddress.city}, ${primaryAddress.country} ${primaryAddress.postalCode || ''}`.trim()
        : 'Standard Commercial Delivery';

      const email = order.user?.email || 'Guest User';
      const customerName = email.includes('@') ? email.split('@')[0].replace(/[._-]/g, ' ') : 'Customer';

      const items = (order.items || []).map((item, idx) => {
        const colorPalette = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-purple-600', 'bg-amber-600'];
        return {
          id: item.id,
          name: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.price),
          imageColor: colorPalette[idx % colorPalette.length],
        };
      });

      const subtotal = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
      const total = Number(order.total);
      const estimatedShipping = Math.max(Math.round((total - subtotal) * 0.6), 0);
      const estimatedTax = Math.max(Number((total - subtotal - estimatedShipping).toFixed(2)), 0);

      const activity = (order.statusHistory || []).map((sh) => ({
        action: `Status: ${sh.status}`,
        status: sh.status,
        timestamp: new Date(sh.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        actor: 'Admin / System',
        note: sh.note || undefined,
      }));

      // If no activity exists, provide initial order placement activity
      if (activity.length === 0) {
        activity.push({
          action: 'Order Placed',
          status: order.status,
          timestamp: new Date(order.createdAt).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          actor: 'Customer',
          note: 'Created via platform checkout',
        });
      }

      return {
        id: order.id,
        customerName,
        customerEmail: email,
        customerPhone: '+1 (555) 019-2834',
        shippingAddress: addressString,
        status: order.status,
        paymentStatus: (order.payment?.status || (order.status === 'paid' ? 'paid' : 'pending')) as string,
        paymentMethod: order.payment?.provider ? `${order.payment.provider.toUpperCase()} (${order.payment.status})` : 'Credit Card (Stripe)',
        createdAt: new Date(order.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        updatedAt: new Date(order.updatedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        items,
        subtotal: subtotal || total,
        shipping: estimatedShipping,
        tax: estimatedTax,
        total,
        trackingNumber: order.shipment?.tracking || undefined,
        activity,
      };
    });
    const mapDuration = performance.now() - tMapStart;
    const totalDuration = performance.now() - t0;

    this.logger.log(
      `[OrdersPerformance] requestId=${reqId} total=${totalDuration.toFixed(1)}ms db=${dbDuration.toFixed(1)}ms mapping=${mapDuration.toFixed(1)}ms page=${safePage} limit=${safeLimit} returned=${mappedOrders.length} totalFiltered=${total}`
    );

    return {
      data: mappedOrders,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
      kpis: {
        totalOrders: kpiData.totalOrders || 0,
        pendingOrders: kpiData.pendingOrders || 0,
        totalRevenue: Number(kpiData.totalRevenue || 0),
        attentionRequired: kpiData.attentionRequired || 0,
      },
    };
  }

  async getOrderByIdAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        payment: true,
        shipment: true,
        user: {
          select: {
            id: true,
            email: true,
            addresses: true,
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateOrderStatus(
    id: string,
    status: OrderStatus,
    note?: string,
    adminUser?: { id?: string; email?: string; role?: string }
  ) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date(),
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
          payment: true,
          shipment: true,
          user: true,
        }
      });

      // 2. Record status change history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note || `Status updated to ${status} by admin`,
        }
      });

      // 3. Log admin action to audit logs
      try {
        await tx.auditLog.create({
          data: {
            userId: adminUser?.id || null,
            userName: adminUser?.email || 'Admin',
            userRole: adminUser?.role || 'admin',
            action: 'UPDATE_ORDER_STATUS',
            entity: 'order',
            entityId: id,
            details: {
              oldStatus: existingOrder.status,
              newStatus: status,
              note,
            }
          }
        });
      } catch (err) {
        this.logger.warn(`Failed to write audit log for order status update: ${err}`);
      }

      this.logger.log(`Order ${id} status updated from ${existingOrder.status} to ${status}`);
      return updatedOrder;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });
  }
}

