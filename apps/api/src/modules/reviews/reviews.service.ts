import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReviewQueryDto } from './dto/review-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recalculates and updates product rating average and rating count.
   */
  private async recalculateProductRating(productId: string, tx?: Prisma.TransactionClient) {
    const db = tx || this.prisma;
    const stats = await db.productReview.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const ratingAvg = stats._avg.rating ? new Prisma.Decimal(stats._avg.rating.toFixed(2)) : new Prisma.Decimal(0);
    const ratingCount = stats._count.rating || 0;

    await db.product.update({
      where: { id: productId },
      data: {
        ratingAvg,
        ratingCount,
      },
    });
  }

  async getAdminReviews(query: ReviewQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductReviewWhereInput = {};

    if (query.rating) {
      where.rating = Number(query.rating);
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { comment: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    let orderBy: Prisma.ProductReviewOrderByWithRelationInput = { createdAt: query.sortDir || 'desc' };
    if (query.sortBy === 'rating') {
      orderBy = { rating: query.sortDir || 'desc' };
    }

    const [reviews, total, allReviewsStats] = await Promise.all([
      this.prisma.productReview.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.productReview.count({ where }),
      this.prisma.productReview.findMany({
        select: {
          id: true,
          rating: true,
          createdAt: true,
        },
      }),
    ]);

    const totalReviews = allReviewsStats.length;
    const sumRatings = allReviewsStats.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalReviews > 0 ? Number((sumRatings / totalReviews).toFixed(1)) : 5.0;
    const fiveStarCount = allReviewsStats.filter(r => r.rating === 5).length;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentReviews = allReviewsStats.filter(r => r.createdAt && new Date(r.createdAt) >= thirtyDaysAgo).length;

    const mapped = reviews.map(r => ({
      id: r.id,
      product: r.product?.name || 'Unknown Product',
      productId: r.productId,
      user: r.user?.email || 'Anonymous',
      userId: r.userId,
      rating: r.rating || 5,
      comment: r.comment || '',
      date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      status: 'Approved',
    }));

    return {
      data: mapped,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      kpis: {
        totalReviews,
        averageRating,
        fiveStarCount,
        recentReviews,
      },
    };
  }

  async deleteReview(id: string) {
    const review = await this.prisma.productReview.findUnique({
      where: { id },
      select: { id: true, productId: true },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.productReview.delete({
        where: { id },
      });

      await this.recalculateProductRating(review.productId, tx);

      return { success: true, message: 'Review deleted successfully' };
    }, {
      maxWait: 15000,
      timeout: 20000,
    });
  }

  async createReview(userId: string, dto: CreateReviewDto) {
    const existing = await this.prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId: dto.productId,
          userId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a review for this product');
    }

    return this.prisma.$transaction(async (tx) => {
      const review = await tx.productReview.create({
        data: {
          productId: dto.productId,
          userId,
          rating: dto.rating,
          comment: dto.comment,
        },
      });

      await this.recalculateProductRating(dto.productId, tx);

      return review;
    }, {
      maxWait: 15000,
      timeout: 20000,
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.productReview.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
