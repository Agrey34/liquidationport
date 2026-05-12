import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(@Req() req) {
    return this.notificationsService.findAllForUser(req.user.id);
  }

  @Patch('mark-all-read')
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id', ParseUUIDPipe) id: string, @Req() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }
}
