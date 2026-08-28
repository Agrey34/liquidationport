import { IsOptional, IsString, IsUUID, IsIn } from 'class-validator';

export class UploadProductImageDto {
  /**
   * Asset type for folder routing:
   * - 'product'   → R2 folder: products/
   * - 'category'  → R2 folder: categories/
   * - 'marketing' → R2 folder: marketing/
   */
  @IsOptional()
  @IsIn(['product', 'category', 'marketing'])
  type?: 'product' | 'category' | 'marketing';

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  stock?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;
}
