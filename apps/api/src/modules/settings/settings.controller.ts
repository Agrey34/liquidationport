import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/setting.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(key, updateSettingDto);
  }
}
