import { Controller, Get, Post, Body, Param, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin') // Only admins can view audit logs
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(@Req() req: any, @Body() body: { action: string; entity: string; entityId?: string; details?: any; userName?: string; userRole?: string; ipAddress?: string; userAgent?: string }) {
    return this.auditService.create(
      req.user.id,
      body.action,
      body.entity,
      body.entityId,
      body.details,
      body.userName || req.user.email,
      body.userRole || req.user.app_metadata?.role,
      body.ipAddress || req.ip,
      body.userAgent || req.headers['user-agent']
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.auditService.findAll(req.query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
