import { Controller, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin') // Only admins can view audit logs
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll() {
    return this.auditService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
