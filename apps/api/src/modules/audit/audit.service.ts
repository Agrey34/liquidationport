import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logActionAsync(params: {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Fire and forget, catch errors internally to prevent blocking
    this.prisma.auditLog.create({ data: params }).catch(err => {
      console.error('AuditLog async failed:', err);
    });
  }

  async create(userId: string, action: string, entity: string, entityId?: string, details?: any, userName?: string, userRole?: string, ipAddress?: string, userAgent?: string) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        entity,
        entityId,
        details,
        ipAddress,
        userAgent
      }
    });
  }

  async findAll(query?: any) {
    const { page = 1, limit = 50, search, entity, action } = query || {};
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }
}
