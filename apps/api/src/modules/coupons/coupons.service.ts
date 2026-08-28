import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCouponDto } from './dto/coupon.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    const code = createCouponDto.code.trim().toUpperCase();

    const existing = await this.prisma.coupon.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Coupon code "${code}" already exists`);
    }

    return this.prisma.coupon.create({
      data: {
        code,
        discount: new Prisma.Decimal(createCouponDto.discount),
        type: createCouponDto.type,
        expiresAt: createCouponDto.expiresAt ? new Date(createCouponDto.expiresAt) : null,
        usageLimit: createCouponDto.usageLimit ? Number(createCouponDto.usageLimit) : null,
      },
    });
  }

  async findAll(search?: string) {
    const where: Prisma.CouponWhereInput = {};
    if (search?.trim()) {
      where.code = { contains: search.trim(), mode: 'insensitive' };
    }

    const coupons = await this.prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });

    const now = new Date();
    let totalUsages = 0;
    let activePromotions = 0;

    const data = coupons.map(coupon => {
      const used = coupon._count?.usages || 0;
      totalUsages += used;

      const isExpiredByDate = coupon.expiresAt ? new Date(coupon.expiresAt) < now : false;
      const isExpiredByLimit = coupon.usageLimit ? used >= coupon.usageLimit : false;
      const status: 'Active' | 'Expired' = (isExpiredByDate || isExpiredByLimit) ? 'Expired' : 'Active';

      if (status === 'Active') {
        activePromotions++;
      }

      return {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        discount: Number(coupon.discount),
        usageLimit: coupon.usageLimit,
        used,
        expires: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : null,
        status,
        createdAt: coupon.createdAt ? new Date(coupon.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return {
      data,
      kpis: {
        activePromotions,
        totalUsages,
        totalCoupons: coupons.length,
      },
    };
  }

  async remove(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    return this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(rawCode: string, userId: string) {
    const code = rawCode.trim().toUpperCase();
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
      include: { _count: { select: { usages: true } } },
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
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
