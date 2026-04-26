import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    await this.findOne(id);
    return this.prisma.admin.update({
      where: { id },
      data: updateAdminDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.admin.delete({
      where: { id },
    });
  }
}
