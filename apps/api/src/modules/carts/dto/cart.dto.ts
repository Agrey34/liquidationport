import { IsUUID, IsInt, Min, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: string | number; // sometimes arrives as string depending on setup
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;
}

export class GuestCartItemDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class MergeGuestSessionDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  @IsOptional()
  guestCart?: GuestCartItemDto[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  guestProductIds?: string[];
}
