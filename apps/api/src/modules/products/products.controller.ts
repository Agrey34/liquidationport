import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ==========================================
  // PUBLIC ENDPOINTS
  // ==========================================

  // Apply cache via Interceptor caching the whole response payload transparently
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 Minutes
  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 Minutes
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }

  // ==========================================
  // PROTECTED ENDPOINTS (Admin Only)
  // ==========================================

  // Prevent generic IP/throttle limits from blocking massive admin data transfers during uploads
  @SkipThrottle()
  @UseGuards(SupabaseAuthGuard)
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @SkipThrottle()
  @UseGuards(SupabaseAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @SkipThrottle()
  @UseGuards(SupabaseAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
