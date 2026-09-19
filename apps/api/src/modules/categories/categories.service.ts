import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CACHE_SERVICE, ICacheService } from '../../common/cache/cache.interface';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Optional() @Inject(CACHE_SERVICE) private readonly cacheService?: ICacheService,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Uploaded file must be an image');
    }

    // Upload to Cloudflare R2 categories/ folder
    const uploadResult = await this.storageService.uploadPublicAsset(file, 'category');
    this.logger.log(`Category image uploaded to R2 categories/ folder: ${uploadResult.url}`);

    return {
      url: uploadResult.url,
      key: uploadResult.key,
      folder: uploadResult.folder,
      bucket: uploadResult.bucket,
    };
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    const created = await this.prisma.category.create({
      data: createCategoryDto,
    });

    if (this.cacheService) {
      await this.cacheService.del('categories:all');
    }

    return created;
  }

  async findAll() {
    const fetcher = () =>
      this.prisma.withRetry(() =>
        this.prisma.category.findMany({
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            createdAt: true,
            _count: {
              select: { products: true },
            },
          },
        }),
      );

    if (this.cacheService) {
      return this.cacheService.getOrSet('categories:all', fetcher, { ttlSeconds: 600 });
    }
    return fetcher();
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    // Check if category exists
    await this.findOne(id);

    // If updating slug, ensure it's not taken
    if (updateCategoryDto.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    if (this.cacheService) {
      await this.cacheService.del('categories:all');
    }

    return updated;
  }

  async remove(id: string) {
    // Check if category exists
    await this.findOne(id);

    const deleted = await this.prisma.category.delete({
      where: { id },
    });

    if (this.cacheService) {
      await this.cacheService.del('categories:all');
    }

    return deleted;
  }
}
