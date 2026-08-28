import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewQueryDto } from './dto/review-query.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Get('admin')
  getAdminReviews(@Query() query: ReviewQueryDto) {
    return this.reviewsService.getAdminReviews(query);
  }

  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @Delete('admin/:id')
  deleteReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.deleteReview(id);
  }

  @Get('product/:productId')
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @UseGuards(SupabaseAuthGuard)
  @Post()
  createReview(@Req() req: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, dto);
  }
}
