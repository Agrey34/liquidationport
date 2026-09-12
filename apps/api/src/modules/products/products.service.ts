import { Injectable, Inject, NotFoundException, ConflictException, Logger } from '@nestjs/common';
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
      manufacturer,
      dimensionL,
      dimensionW,
      dimensionH,
      liquidatorName,
      liquidatorLogo,
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

    // 1. Validate custom SKU uniqueness upfront to prevent unhandled database aborts
    if (sku && sku.trim()) {
      const existingSku = await this.prisma.productVariant.findUnique({
        where: { sku: sku.trim() },
        include: { product: true },
      });
      if (existingSku) {
        // If the product owning this SKU was soft-deleted, release the SKU from the deleted product
        if (existingSku.product && existingSku.product.deletedAt !== null) {
          await this.prisma.productVariant.update({
            where: { id: existingSku.id },
            data: { sku: `${existingSku.sku}_DELETED_${Date.now()}` },
          });
        } else {
          const ownerName = existingSku.product?.name ? `"${existingSku.product.name}"` : 'another product';
          throw new ConflictException(
            `SKU "${sku.trim()}" is already assigned to active product ${ownerName}. Please specify a unique SKU.`,
          );
        }
      }
    }

    if (variants && variants.length > 0) {
      for (const v of variants) {
        if (v.sku && v.sku.trim()) {
          const existingVarSku = await this.prisma.productVariant.findUnique({
            where: { sku: v.sku.trim() },
            include: { product: true },
          });
          if (existingVarSku) {
            if (existingVarSku.product && existingVarSku.product.deletedAt !== null) {
              await this.prisma.productVariant.update({
                where: { id: existingVarSku.id },
                data: { sku: `${existingVarSku.sku}_DELETED_${Date.now()}` },
              });
            } else {
              const ownerName = existingVarSku.product?.name ? `"${existingVarSku.product.name}"` : 'another product';
              throw new ConflictException(
                `Variant SKU "${v.sku.trim()}" is already assigned to active product ${ownerName}. Please specify a unique SKU.`,
              );
            }
          }
        }
      }
    }

    try {
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
            manufacturer: manufacturer || null,
            dimensionL: dimensionL !== undefined && dimensionL !== null ? Number(dimensionL) : null,
            dimensionW: dimensionW !== undefined && dimensionW !== null ? Number(dimensionW) : null,
            dimensionH: dimensionH !== undefined && dimensionH !== null ? Number(dimensionH) : null,
            liquidatorName: liquidatorName || null,
            liquidatorLogo: liquidatorLogo || null,
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
            const variantEntropy = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
            const variantSku = v.sku?.trim() || `${slug.toUpperCase()}-VAR-${i + 1}-${variantEntropy}`;
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
          // Create default variant for single pallet / listing with collision-proof SKU
          const uniqueEntropy = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
          const defaultSku = sku?.trim() || `${slug.toUpperCase()}-PLT-${uniqueEntropy}`;

          await tx.productVariant.create({
            data: {
              productId: newProduct.id,
              sku: defaultSku,
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
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('sku') || String(err.meta?.target).includes('sku')) {
          throw new ConflictException(
            'A product variant with this SKU already exists. Please specify a unique SKU.',
          );
        }
        if (target.includes('slug') || String(err.meta?.target).includes('slug')) {
          throw new ConflictException(
            'A product with this URL slug already exists. Please adjust the title.',
          );
        }
      }
      throw err;
    }
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
      manufacturer,
      dimensionL,
      dimensionW,
      dimensionH,
      liquidatorName,
      liquidatorLogo,
      ...rest
    } = updateProductDto;

    // Validate custom SKU uniqueness upfront if specified
    if (sku && sku.trim()) {
      const existingSku = await this.prisma.productVariant.findFirst({
        where: {
          sku: sku.trim(),
          productId: { not: id },
        },
      });
      if (existingSku) {
        throw new ConflictException(
          `SKU "${sku.trim()}" is already assigned to another product variant. Please specify a unique SKU.`,
        );
      }
    }

    if (variants && variants.length > 0) {
      for (const v of variants) {
        if (v.sku && v.sku.trim()) {
          const existingVarSku = await this.prisma.productVariant.findFirst({
            where: {
              sku: v.sku.trim(),
              productId: { not: id },
            },
          });
          if (existingVarSku) {
            throw new ConflictException(
              `Variant SKU "${v.sku.trim()}" is already assigned to another product variant. Please specify a unique SKU.`,
            );
          }
        }
      }
    }

    try {
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
              const variantEntropy = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
              const variantSku = v.sku?.trim() || `${id.slice(0, 8).toUpperCase()}-VAR-${i + 1}-${variantEntropy}`;
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
        if (manufacturer !== undefined) updateData.manufacturer = manufacturer || null;
        if (dimensionL !== undefined) updateData.dimensionL = dimensionL !== null ? Number(dimensionL) : null;
        if (dimensionW !== undefined) updateData.dimensionW = dimensionW !== null ? Number(dimensionW) : null;
        if (dimensionH !== undefined) updateData.dimensionH = dimensionH !== null ? Number(dimensionH) : null;
        if (liquidatorName !== undefined) updateData.liquidatorName = liquidatorName || null;
        if (liquidatorLogo !== undefined) updateData.liquidatorLogo = liquidatorLogo || null;
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
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('sku') || String(err.meta?.target).includes('sku')) {
          throw new ConflictException(
            'A product variant with this SKU already exists. Please specify a unique SKU.',
          );
        }
        if (target.includes('slug') || String(err.meta?.target).includes('slug')) {
          throw new ConflictException(
            'A product with this URL slug already exists. Please adjust the title.',
          );
        }
      }
      throw err;
    }
  }

  async remove(id: string) {
    // 1. Commit soft delete mutation to database
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // 2. Release SKUs on variants so they can be reused by future products
    try {
      const variants = await this.prisma.productVariant.findMany({
        where: { productId: id },
      });
      for (const v of variants) {
        if (!v.sku.includes('_DELETED_')) {
          await this.prisma.productVariant.update({
            where: { id: v.id },
            data: { sku: `${v.sku}_DELETED_${Date.now()}` },
          });
        }
      }
    } catch (variantErr) {
      this.logger.warn(`Failed to release variant SKUs for product ${id}: ${variantErr}`);
    }

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
