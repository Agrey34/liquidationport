import { Controller, Get, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@Req() req) {
    // req.user is populated by SupabaseAuthGuard
    return this.usersService.findProfile(req.user.id);
  }

  @Patch('me')
  updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  // Admin routes
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: string,
  ) {
    return this.usersService.changeStatus(id, status);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @Patch(':id/role')
  changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('role') role: string,
  ) {
    return this.usersService.changeRole(id, role);
  }

  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
