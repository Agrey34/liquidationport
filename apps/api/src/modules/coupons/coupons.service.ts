import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: createCouponDto.code },
    });

    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    return this.prisma.coupon.create({
      data: {
        ...createCouponDto,
        expiresAt: createCouponDto.expiresAt ? new Date(createCouponDto.expiresAt) : null,
      },
    });
  }

  async findAll() {
    return this.prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(code: string, userId: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: { _count: { select: { usages: true } } },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit && coupon._count.usages >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }

    const hasUsed = await this.prisma.couponUsage.findUnique({
      where: {
        couponId_userId: {
          couponId: coupon.id,
          userId,
        },
      },
    });

    if (hasUsed) {
      throw new BadRequestException('You have already used this coupon');
    }

    return coupon;
  }
}
