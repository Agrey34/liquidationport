import { Controller, Get, Post, Body, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { BackupService } from './backup.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('backups')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('trigger')
  @Roles('admin', 'super_admin')
  @HttpCode(HttpStatus.OK)
  triggerBackup() {
    return this.backupService.triggerBackup();
  }

  @Post('restore')
  @Roles('super_admin')
  @HttpCode(HttpStatus.OK)
  restoreFromBackup(@Body('filename') filename: string) {
    return this.backupService.restoreFromBackup(filename);
  }

  @Get()
  @Roles('admin', 'super_admin')
  listBackups() {
    return this.backupService.listBackups();
  }
}
