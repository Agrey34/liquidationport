import { Controller, Get, Post, Body, Param, Delete, UseGuards, ParseUUIDPipe, Req, HttpCode } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.remove(id);
  }

  // Public/Customer route to validate a coupon
  @UseGuards(SupabaseAuthGuard)
  @Post('validate')
  @HttpCode(200)
  validate(@Req() req, @Body() validateCouponDto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(validateCouponDto.code, req.user.id);
  }
}
