import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    return this.prisma.category.create({
      data: createCategoryDto,
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
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

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(id: string) {
    // Check if category exists
    await this.findOne(id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
