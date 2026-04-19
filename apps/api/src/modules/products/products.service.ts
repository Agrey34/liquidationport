import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, SortByEnum } from './dto/product-query.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache
  ) {}

  // ==========================================
  // READ OPERATIONS (Safely cached globally in controller usually, but caching individual misses)
  // ==========================================

  async findAll(query: ProductQueryDto) {
    const { 
      search, category, minPrice, maxPrice, inStock, sortBy, page = 1, limit = 20 
    } = query;

    const skip = (page - 1) * limit;

    // Build the dynamic where clause based on query DTO
    const where: Prisma.ProductWhereInput = {
      deletedAt: null // Always enforce soft-delete filter
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { slug: category };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    if (inStock) {
      where.variants = {
        some: { 
          inventory: { quantity: { gt: 0 } }
        }
      };
    }

    // Build the OrderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === SortByEnum.PRICE_ASC) orderBy = { price: 'asc' };
    if (sortBy === SortByEnum.PRICE_DESC) orderBy = { price: 'desc' };
    if (sortBy === SortByEnum.CREATED_AT) orderBy = { createdAt: 'desc' };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          variants: true,
          media: true,
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOneBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        variants: {
           include: { inventory: true }
        },
        media: true,
      }
    });

    if (!product) throw new NotFoundException(`Product not found`);
    return product;
  }

  // ==========================================
  // WRITE OPERATIONS (Admin Protected)
  // ==========================================

  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto,
    });
    // Invalidate product cache upon new creation
    await this.clearProductCache();
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto
    });
    await this.clearProductCache();
    return product;
  }

  async remove(id: string) {
    // Soft Delete execution
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    await this.clearProductCache();
    return product;
  }

  // ==========================================
  // CACHE INVALIDATION
  // ==========================================
  private async clearProductCache() {
    // Because `@nestjs/cache-manager` with in-memory stores caches by exact URL keys natively (if using interceptors),
    // resetting the store prevents stale generic list displays.
    await this.cacheManager.reset();
  }
}
