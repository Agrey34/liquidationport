import { IsUUID, IsInt, Min } from 'class-validator';

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
