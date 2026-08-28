import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateShipmentDto, UpdateShipmentDto } from './dto/shipment.dto';

@Injectable()
export class ShipmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createShipmentDto: CreateShipmentDto) {
    const existing = await this.prisma.shipment.findUnique({
      where: { orderId: createShipmentDto.orderId },
    });

    if (existing) {
      throw new ConflictException('Shipment already exists for this order');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: createShipmentDto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status to shipped and create shipment inside a transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'shipped' },
      });

      return tx.shipment.create({
        data: {
          ...createShipmentDto,
          shippedAt: new Date(),
        },
      });
    }, {
      maxWait: 15000,
      timeout: 20000,
    });
  }

  async findOneByOrder(orderId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { orderId },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment for order ${orderId} not found`);
    }

    return shipment;
  }

  async update(id: string, updateShipmentDto: UpdateShipmentDto) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    return this.prisma.shipment.update({
      where: { id },
      data: updateShipmentDto,
    });
  }

  async markAsDelivered(id: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }

    // Update order status to delivered and update shipment inside a transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: shipment.orderId },
        data: { status: 'delivered' },
      });

      return tx.shipment.update({
        where: { id },
        data: { deliveredAt: new Date() },
      });
    }, {
      maxWait: 15000,
      timeout: 20000,
    });
  }
}
