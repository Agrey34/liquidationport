import { Controller, Get, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { UpdateAdminDto } from './dto/admin.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admins')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('dashboard-stats')
  getDashboardStats() {
    return this.adminsService.getDashboardStats();
  }

  @Get()
  @Roles('super_admin')
  findAll() {
    return this.adminsService.findAll();
  }

  @Get(':id')
  @Roles('super_admin')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    return this.adminsService.update(id, updateAdminDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.remove(id);
  }
}
