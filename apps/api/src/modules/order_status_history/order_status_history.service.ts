import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrderStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findByOrderId(orderId: string) {
    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
