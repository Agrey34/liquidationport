import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({
      where: { name: createTagDto.name },
    });

    if (existing) {
      throw new ConflictException('Tag with this name already exists');
    }

    return this.prisma.tag.create({
      data: createTagDto,
    });
  }

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag;
  }

  async update(id: string, updateTagDto: UpdateTagDto) {
    await this.findOne(id);

    if (updateTagDto.name) {
      const existing = await this.prisma.tag.findUnique({
        where: { name: updateTagDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tag with this name already exists');
      }
    }

    return this.prisma.tag.update({
      where: { id },
      data: updateTagDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.tag.delete({
      where: { id },
    });
  }
}
