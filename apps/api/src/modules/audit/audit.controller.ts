import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { AuditService, AuditQueryParams } from './audit.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser, AuthenticatedRequest } from '../../types/authenticated-request.interface';
import { Req } from '@nestjs/common';

/** Shape of the manual audit log creation body */
interface CreateAuditBody {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  userName?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Controller('audit')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateAuditBody,
  ) {
    return this.auditService.create(
      user.id,
      body.action,
      body.entity,
      body.entityId,
      body.details,
      body.userName ?? user.email,
      body.userRole ?? user.app_metadata?.role,
      body.ipAddress ?? (req.ip as string | undefined),
      body.userAgent ?? (req.headers['user-agent'] as string | undefined),
    );
  }

  @Get()
  findAll(@Query() query: AuditQueryParams) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
