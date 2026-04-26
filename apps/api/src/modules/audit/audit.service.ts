import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: { email: true, role: true }
        }
      }
    });
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        admin: {
          select: { email: true, role: true }
        }
      }
    });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }
}
