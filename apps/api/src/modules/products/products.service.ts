import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, SortByEnum } from './dto/product-query.dto';
import { CACHE_SERVICE, ICacheService } from '../../common/cache/cache.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
    private readonly storageService: StorageService,
  ) {}

  // ==========================================
  // STORAGE OPERATIONS (Cloudflare R2)
  // ==========================================

  async uploadImages(files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      return { urls: [] };
    }

    const uploadPromises = files.map(async (file) => {
      const uploadResult = await this.storageService.uploadPublicProductImage(file, 'products');
      return uploadResult.url;
    });

    const urls = await Promise.all(uploadPromises);
    this.logger.log(`Uploaded ${urls.length} product image(s) to Cloudflare R2 successfully`);
    return { urls };
  }

  // ==========================================
  // READ OPERATIONS (Stampede-Protected Caching)
  // ==========================================

  async findAll(query: ProductQueryDto) {
    const { 
      search, category, minPrice, maxPrice, inStock, sortBy, page = 1, limit = 20 
    } = query;

    // Enforce safe server-side pagination clamp (1 to 100)
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (safePage - 1) * safeLimit;

    // Deterministic canonical cache key with tenant scoping
    const cacheKey = this.cacheService.generateKey('products:list', {
      search,
      category,
      minPrice,
      maxPrice,
      inStock,
      sortBy,
      page: safePage,
      limit: safeLimit,
    });

    // Execute with single-flight stampede protection (300s / 5 min TTL)
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Build the dynamic where clause based on query DTO
        const where: Prisma.ProductWhereInput = {
          deletedAt: null, // Always enforce soft-delete filter
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
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
              stock: { gt: 0 }
            }
          };
        }

        // Build the OrderBy clause
        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
        if (sortBy === SortByEnum.PRICE_ASC) orderBy = { price: 'asc' };
        if (sortBy === SortByEnum.PRICE_DESC) orderBy = { price: 'desc' };
        if (sortBy === SortByEnum.CREATED_AT) orderBy = { createdAt: 'desc' };

        const [data, total] = await Promise.all([
          this.prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: safeLimit,
            include: {
              category: {
                select: { id: true, name: true, slug: true }
              },
              variants: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                  price: true,
                  stock: true,
                  condition: true,
                  upc: true,
                  msrp: true,
                  manufacturer: true,
                }
              },
              media: {
                select: { id: true, url: true, altText: true, position: true },
                orderBy: { position: 'asc' },
              },
              tags: {
                include: { tag: true },
              },
            }
          }),
          this.prisma.product.count({ where })
        ]);

        const sanitizedData = data.map((product) => ({
          ...product,
          media: product.media?.map((m) => ({
            ...m,
            url: this.normalizeMediaUrl(m.url),
          })),
        }));

        return {
          data: sanitizedData,
          total,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit)
        };
      },
      { ttlSeconds: 300 }
    );
  }

  async findOneBySlug(slug: string) {
    const clean = decodeURIComponent(slug).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean);
    const cacheKey = this.cacheService.generateKey('products:detail', { slug: clean.toLowerCase() });

    // Execute with single-flight stampede protection (600s / 10 min TTL)
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        let product = null;

        if (isUuid) {
          product = await this.prisma.product.findFirst({
            where: { id: clean, deletedAt: null },
            include: {
              category: true,
              variants: {
                include: { inventory: true },
                orderBy: { createdAt: 'asc' },
              },
              media: {
                orderBy: { position: 'asc' },
              },
              tags: {
                include: { tag: true },
              },
            },
          });
        }

        if (!product) {
          // Lookup by exact slug or case-insensitive match
          product = await this.prisma.product.findFirst({
            where: {
              deletedAt: null,
              OR: [
                { slug: clean },
                { slug: clean.toLowerCase() },
                { slug: { equals: clean, mode: 'insensitive' } },
              ],
            },
            include: {
              category: true,
              variants: {
                include: { inventory: true },
                orderBy: { createdAt: 'asc' },
              },
              media: {
                orderBy: { position: 'asc' },
              },
              tags: {
                include: { tag: true },
              },
            },
          });
        }

        if (!product) {
          throw new NotFoundException(`Product not found`);
        }

        if (product.media && product.media.length > 0) {
          product.media = product.media.map((m) => ({
            ...m,
            url: this.normalizeMediaUrl(m.url),
          }));
        }

        return product;
      },
      { ttlSeconds: 60 }
    );
  }

  private normalizeMediaUrl(url: string): string {
    if (!url || typeof url !== 'string') return url;

    const r2PublicDomain =
      this.configService.get<string>('r2.publicDomain') ||
      this.configService.get<string>('R2_PUBLIC_DOMAIN');

    if (url.includes('pub-ecommerce-product-images.r2.dev') || url.includes('.r2.cloudflarestorage.com')) {
      const parts = url.split('.r2.dev/');
      let key = parts[1] || url.split('.r2.cloudflarestorage.com/')[1] || '';
      if (key.startsWith('ecommerce-product-images/')) {
        key = key.replace('ecommerce-product-images/', '');
      }

      if (key) {
        // If a real public CDN domain is configured (e.g. media.liquidationport.com), use it directly
        if (
          r2PublicDomain &&
          !r2PublicDomain.includes('pub-ecommerce-product-images.r2.dev') &&
          !r2PublicDomain.includes('.r2.cloudflarestorage.com') &&
          !r2PublicDomain.includes('localhost')
        ) {
          const base = r2PublicDomain.startsWith('http')
            ? r2PublicDomain.replace(/\/$/, '')
            : `https://${r2PublicDomain.replace(/\/$/, '')}`;
          return `${base}/${key.replace(/^\//, '')}`;
        }

        // Return relative API proxy path for reliable cross-environment streaming
        return `/api/v1/shop/media/${key.replace(/^\//, '')}`;
      }
    }

    // If stored with localhost in the DB, normalize it to relative path
    if (url.includes('localhost:4000') || url.includes('127.0.0.1:4000')) {
      if (url.includes('/api/v1/shop/media/')) {
        const key = url.split('/api/v1/shop/media/')[1];
        return `/api/v1/shop/media/${key.replace(/^\//, '')}`;
      }
      if (url.includes('/shop/media/')) {
        const key = url.split('/shop/media/')[1];
        return `/api/v1/shop/media/${key.replace(/^\//, '')}`;
      }
    }

    return url;
  }

  // ==========================================
  // WRITE OPERATIONS (Post-Commit Invalidation)
  // ==========================================

  async create(createProductDto: CreateProductDto) {
    const {
      images,
      tags,
      variants,
      manifest,
      category,
      categoryId,
      condition,
      status,
      comparePrice,
      costPrice,
      sku,
      weight,
      ...rest
    } = createProductDto;

    let slug = rest.slug;
    if (!slug) {
      slug = rest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const existing = await this.prisma.product.findFirst({
      where: { slug }
    });

    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await this.prisma.$transaction(async (tx) => {
      // 1. Resolve Category
      let resolvedCategoryId: string | null = categoryId || null;
      if (!resolvedCategoryId && category && category.trim()) {
        const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let cat = await tx.category.findFirst({
          where: {
            OR: [
              { name: { equals: category.trim(), mode: 'insensitive' } },
              { slug: catSlug },
            ],
          },
        });
        if (!cat) {
          cat = await tx.category.create({
            data: {
              name: category.trim(),
              slug: catSlug || `category-${Date.now()}`,
            },
          });
        }
        resolvedCategoryId = cat.id;
      }

      // 2. Create Product
      const newProduct = await tx.product.create({
        data: {
          name: rest.name,
          slug,
          description: rest.description || null,
          price: Number(rest.price) || 0,
          stock: Number(rest.stock) || 0,
          condition: condition || 'Untested Customer Returns',
          status: status || 'Active',
          comparePrice: comparePrice !== undefined && comparePrice !== null ? Number(comparePrice) : null,
          costPrice: costPrice !== undefined && costPrice !== null ? Number(costPrice) : null,
          sku: sku || null,
          weight: weight !== undefined && weight !== null ? Number(weight) : null,
          manifest: manifest ? (manifest as unknown as Prisma.InputJsonValue) : undefined,
          categoryId: resolvedCategoryId,
          ...(images && images.length > 0
            ? {
                media: {
                  create: images.map((url, index) => ({
                    url,
                    position: index,
                  })),
                },
              }
            : {}),
        },
      });

      // 3. Create Variants
      if (variants && variants.length > 0) {
        for (let i = 0; i < variants.length; i++) {
          const v = variants[i];
          const variantSku = v.sku?.trim() || `${slug}-VAR-${i + 1}-${Math.random().toString(36).substring(2, 6)}`;
          await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              sku: variantSku,
              name: v.name || `${newProduct.name} - Variant ${i + 1}`,
              price: v.price !== undefined && v.price !== null ? Number(v.price) : Number(rest.price) || 0,
              stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 1,
              condition: v.condition || condition || null,
              upc: v.upc || null,
              msrp: v.msrp !== undefined && v.msrp !== null ? Number(v.msrp) : null,
              manufacturer: v.manufacturer || null,
            },
          });
        }
      } else {
        // Create default variant for single pallet / listing
        await tx.productVariant.create({
          data: {
            productId: newProduct.id,
            sku: sku || `${slug}-PALLET-1`,
            name: newProduct.name,
            price: Number(rest.price) || 0,
            stock: Number(rest.stock) || 1,
            condition: condition || 'Untested Customer Returns',
            msrp: comparePrice !== undefined && comparePrice !== null ? Number(comparePrice) : null,
          },
        });
      }

      // 4. Create Tags
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          if (!tagName || !tagName.trim()) continue;
          const cleanName = tagName.trim();
          let tag = await tx.tag.findUnique({
            where: { name: cleanName },
          });
          if (!tag) {
            tag = await tx.tag.create({
              data: { name: cleanName },
            });
          }
          await tx.productTag.create({
            data: {
              productId: newProduct.id,
              tagId: tag.id,
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          media: { orderBy: { position: 'asc' } },
          category: true,
          variants: true,
          tags: { include: { tag: true } },
        },
      });
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    // Invalidate product caches
    await this.clearProductCache();
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const {
      images,
      tags,
      variants,
      manifest,
      category,
      categoryId,
      condition,
      status,
      comparePrice,
      costPrice,
      sku,
      weight,
      ...rest
    } = updateProductDto;

    const product = await this.prisma.$transaction(async (tx) => {
      // 1. Resolve Category
      let resolvedCategoryId: string | null | undefined = categoryId;
      if (categoryId === undefined && category && category.trim()) {
        const catSlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let cat = await tx.category.findFirst({
          where: {
            OR: [
              { name: { equals: category.trim(), mode: 'insensitive' } },
              { slug: catSlug },
            ],
          },
        });
        if (!cat) {
          cat = await tx.category.create({
            data: {
              name: category.trim(),
              slug: catSlug || `category-${Date.now()}`,
            },
          });
        }
        resolvedCategoryId = cat.id;
      }

      // 2. Update Media if provided
      if (images !== undefined) {
        await tx.productMedia.deleteMany({
          where: { productId: id },
        });

        if (images.length > 0) {
          await tx.productMedia.createMany({
            data: images.map((url, index) => ({
              productId: id,
              url,
              position: index,
            })),
          });
        }
      }

      // 3. Update Variants if provided
      if (variants !== undefined) {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        if (variants.length > 0) {
          for (let i = 0; i < variants.length; i++) {
            const v = variants[i];
            const variantSku = v.sku?.trim() || `${id.slice(0, 8)}-VAR-${i + 1}-${Math.random().toString(36).substring(2, 6)}`;
            await tx.productVariant.create({
              data: {
                productId: id,
                sku: variantSku,
                name: v.name || `Variant ${i + 1}`,
                price: v.price !== undefined && v.price !== null ? Number(v.price) : Number(rest.price || 0),
                stock: v.stock !== undefined && v.stock !== null ? Number(v.stock) : 1,
                condition: v.condition || condition || null,
                upc: v.upc || null,
                msrp: v.msrp !== undefined && v.msrp !== null ? Number(v.msrp) : null,
                manufacturer: v.manufacturer || null,
              },
            });
          }
        }
      }

      // 4. Update Tags if provided
      if (tags !== undefined) {
        await tx.productTag.deleteMany({
          where: { productId: id },
        });

        for (const tagName of tags) {
          if (!tagName || !tagName.trim()) continue;
          const cleanName = tagName.trim();
          let tag = await tx.tag.findUnique({
            where: { name: cleanName },
          });
          if (!tag) {
            tag = await tx.tag.create({
              data: { name: cleanName },
            });
          }
          await tx.productTag.create({
            data: {
              productId: id,
              tagId: tag.id,
            },
          });
        }
      }

      // 5. Update Product Table Record
      const updateData: Prisma.ProductUpdateInput = {
        updatedAt: new Date(),
      };

      if (rest.name !== undefined) updateData.name = rest.name;
      if (rest.slug !== undefined) updateData.slug = rest.slug;
      if (rest.description !== undefined) updateData.description = rest.description;
      if (rest.price !== undefined) updateData.price = Number(rest.price);
      if (rest.stock !== undefined) updateData.stock = Number(rest.stock);
      if (condition !== undefined) updateData.condition = condition;
      if (status !== undefined) updateData.status = status;
      if (comparePrice !== undefined) updateData.comparePrice = comparePrice !== null ? Number(comparePrice) : null;
      if (costPrice !== undefined) updateData.costPrice = costPrice !== null ? Number(costPrice) : null;
      if (sku !== undefined) updateData.sku = sku;
      if (weight !== undefined) updateData.weight = weight !== null ? Number(weight) : null;
      if (manifest !== undefined) updateData.manifest = manifest as unknown as Prisma.InputJsonValue;
      if (resolvedCategoryId !== undefined) updateData.category = resolvedCategoryId ? { connect: { id: resolvedCategoryId } } : { disconnect: true };

      return tx.product.update({
        where: { id },
        data: updateData,
        include: {
          media: {
            orderBy: { position: 'asc' },
          },
          category: true,
          variants: true,
          tags: { include: { tag: true } },
        },
      });
    }, {
      maxWait: 15000,
      timeout: 20000,
    });

    // Invalidate product caches
    await this.clearProductCache();
    return product;
  }

  async remove(id: string) {
    // Commit soft delete mutation to database
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Invalidate product caches
    await this.clearProductCache();
    return product;
  }

  // ==========================================
  // CACHE INVALIDATION
  // ==========================================
  private async clearProductCache(): Promise<void> {
    try {
      const purged = await this.cacheService.delByPattern('products:');
      this.logger.debug(`[ProductsService] Post-mutation cache purged: ${purged} keys invalidated`);
    } catch (error) {
      this.logger.warn(`[ProductsService] Failed to clear product cache: ${error}`);
    }
  }
}
