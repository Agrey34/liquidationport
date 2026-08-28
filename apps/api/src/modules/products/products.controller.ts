import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  // ==========================================
  // PROTECTED ENDPOINTS (Admin Only)
  // ==========================================

  @Throttle({ short: { limit: 10, ttl: 1000 }, medium: { limit: 50, ttl: 10000 }, long: { limit: 120, ttl: 60000 } })
  @UseGuards(SupabaseAuthGuard)
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 8))
  async upload(@UploadedFiles() files: Array<Express.Multer.File>) {
    return this.productsService.uploadImages(files);
  }

  @Throttle({ short: { limit: 5, ttl: 1000 }, medium: { limit: 30, ttl: 10000 }, long: { limit: 120, ttl: 60000 } })
  @UseGuards(SupabaseAuthGuard)
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Throttle({ short: { limit: 5, ttl: 1000 }, medium: { limit: 30, ttl: 10000 }, long: { limit: 120, ttl: 60000 } })
  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Throttle({ short: { limit: 5, ttl: 1000 }, medium: { limit: 30, ttl: 10000 }, long: { limit: 120, ttl: 60000 } })
  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
