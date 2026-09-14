import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateAuditLogParams {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryParams {
  page?: number | string;
  limit?: number | string;
  search?: string;
  entity?: string;
  action?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fire-and-forget audit log write.
   * Errors are swallowed to prevent blocking the caller's critical path.
   */
  logActionAsync(params: CreateAuditLogParams): void {
    this.prisma.auditLog
      .create({
        data: {
          ...params,
          // Prisma requires InputJsonValue for JSON columns; Record<string, unknown> is compatible at runtime
          details: params.details as Prisma.InputJsonValue | undefined,
        },
      })
      .catch((err: unknown) => {
        console.error('AuditLog async write failed:', err);
      });
  }

  async create(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    details?: Record<string, unknown>,
    userName?: string,
    userRole?: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        userName,
        userRole,
        action,
        entity,
        entityId,
        // Cast required: Prisma.InputJsonValue is a recursive readonly type;
        // Record<string, unknown> is assignable at runtime but not statically
        details: details as Prisma.InputJsonValue | undefined,
        ipAddress,
        userAgent,
      },
    });
  }

  async findAll(query: AuditQueryParams = {}) {
    const { page = 1, limit = 50, search, entity, action } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Prisma.AuditLogWhereInput = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { entityId: search }, // entityId is a plain string match
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }
}
