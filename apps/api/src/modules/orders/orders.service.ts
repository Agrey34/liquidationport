import { BadRequestException, Injectable, Logger, NotFoundException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CACHE_SERVICE, ICacheService } from '../../common/cache/cache.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { AuthenticatedUser } from '../../types/authenticated-request.interface';
import { assertValidOrderTransition } from './order-state-machine';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() @Inject(CACHE_SERVICE) private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Creates a new order using a secure Prisma transaction.
   * Validates stock availability, snapshots prices, reserves inventory,
   * logs inventory movements, emits an outbox event, and enforces idempotency.
   */
  async createOrder(
    userId: string,
    createOrderDto: CreateOrderDto,
    idempotencyKey?: string,
  ) {
    // 0. Idempotency Check: if key provided and valid, return cached response
    if (idempotencyKey) {
      const cachedKey = await this.prisma.idempotencyKey.findUnique({
        where: { key: idempotencyKey },
      });
      if (cachedKey && cachedKey.expiresAt > new Date()) {
        this.logger.log(`Returning idempotent response for key: ${idempotencyKey}`);
        return cachedKey.responseBody;
      }
    }

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

      // 5. Record InventoryMovement audit for stock reservations
      if (tx.inventoryMovement?.create) {
        for (const item of items) {
          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              quantityChange: -item.quantity,
              type: 'RESERVATION',
              referenceType: 'order',
              referenceId: order.id,
              note: `Inventory reserved for order #${order.id}`,
              actorId: userId,
            },
          });
        }
      }

      // 6. Write outbox event for reliable notification delivery
      if (tx.outboxEvent?.create) {
        await tx.outboxEvent.create({
          data: {
            eventType: 'ORDER_CREATED',
            payload: {
              orderId: order.id,
              userId,
              total: orderTotal,
            },
            status: 'pending',
          },
        });
      }

      // 7. Save Idempotency key if provided
      if (idempotencyKey && tx.idempotencyKey?.upsert) {
        const jsonOrder = JSON.parse(JSON.stringify(order)) as Prisma.InputJsonValue;
        await tx.idempotencyKey.upsert({
          where: { key: idempotencyKey },
          update: { responseBody: jsonOrder },
          create: {
            key: idempotencyKey,
            userId,
            responseBody: jsonOrder,
            statusCode: 201,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
          },
        });
      }

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
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
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

    // Construct typed Prisma Where Input
    const where: Prisma.OrderWhereInput = {};

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

    // Dynamic sorting with typed Prisma orderBy
    const sortDirection: Prisma.SortOrder = sortDir === 'asc' ? 'asc' : 'desc';
    let orderBy: Prisma.OrderOrderByWithRelationInput = { createdAt: sortDirection };
    if (sortBy === 'total') {
      orderBy = { total: sortDirection };
    } else if (sortBy === 'status') {
      orderBy = { status: sortDirection };
    } else if (sortBy === 'id') {
      orderBy = { id: sortDirection };
    }

    // Execute queries with controlled concurrency and cached KPIs
    const tDbStart = performance.now();
    const rawOrders = await this.prisma.order.findMany({
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
            phone: true,
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
    });

    // 2. Filtered total count for pagination metadata (fast-path for page 1)
    let total: number;
    if (safePage === 1 && rawOrders.length < safeLimit && !skip) {
      total = rawOrders.length;
    } else {
      total = await this.prisma.order.count({ where });
    }

    // 3. Platform consolidated KPI metrics (cached for 60s to prevent constant heavy full-table scans)
    const fetchKpis = async () => {
      const rows = await this.prisma.$queryRaw<Array<{
        totalOrders: number;
        pendingOrders: number;
        totalRevenue: number;
        attentionRequired: number;
      }>>`
        SELECT 
          COUNT(o.id)::int AS "totalOrders",
          COUNT(o.id) FILTER (WHERE o.status = 'pending')::int AS "pendingOrders",
          COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0)::float AS "totalRevenue",
          COUNT(o.id) FILTER (
            WHERE o.status = 'pending' 
            OR p.status = 'failed'
          )::int AS "attentionRequired"
        FROM "orders" o
        LEFT JOIN "payments" p ON p.order_id = o.id;
      `;
      return rows?.[0] || {
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        attentionRequired: 0,
      };
    };

    const kpiData = this.cacheService
      ? await this.cacheService.getOrSet('admin:orders:kpis', fetchKpis, { ttlSeconds: 60 })
      : await fetchKpis();
    const dbDuration = performance.now() - tDbStart;

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
        customerPhone: order.user?.phone ?? null,
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
    adminUser?: Partial<Pick<AuthenticatedUser, 'id' | 'email' | 'role'>>,
  ) {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Guard: enforce the order state machine before touching the DB
    assertValidOrderTransition(existingOrder.status, status);

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

      // 3. Handle stock restoration on cancellation or refund
      if (status === OrderStatus.cancelled || status === OrderStatus.refunded) {
        for (const item of existingOrder.items) {
          if (item.variantId) {
            if (existingOrder.status === OrderStatus.pending) {
              // Order was only pending: release the reservation hold
              await tx.inventory.updateMany({
                where: { variantId: item.variantId },
                data: {
                  reserved: { decrement: item.quantity },
                },
              });
            } else {
              // Order was paid/processing/shipped: return stock quantity to available inventory
              await tx.inventory.updateMany({
                where: { variantId: item.variantId },
                data: {
                  quantity: { increment: item.quantity },
                },
              });
            }

            // Record movement audit
            if (tx.inventoryMovement?.create) {
              await tx.inventoryMovement.create({
                data: {
                  variantId: item.variantId,
                  quantityChange: item.quantity,
                  type: status === OrderStatus.cancelled ? 'CANCELLATION' : 'RETURN',
                  referenceType: 'order',
                  referenceId: id,
                  note: `Order #${id} status changed from ${existingOrder.status} to ${status}`,
                  actorId: adminUser?.id || null,
                },
              });
            }
          }
        }
      }

      // 4. Log admin action to audit logs
      try {
        if (tx.auditLog?.create) {
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
        }
      } catch (err) {
        this.logger.warn(`Failed to write audit log for order status update: ${err}`);
      }

      // 5. Emit Outbox event for asynchronous notification / webhook dispatch
      if (tx.outboxEvent?.create) {
        await tx.outboxEvent.create({
          data: {
            eventType: 'ORDER_STATUS_CHANGED',
            payload: {
              orderId: id,
              userId: existingOrder.userId,
              oldStatus: existingOrder.status,
              status,
              note,
            },
            status: 'pending',
          },
        });
      }

      this.logger.log(`Order ${id} status updated from ${existingOrder.status} to ${status}`);
      return updatedOrder;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });
  }
}

