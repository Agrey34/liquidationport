import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  @IsNotEmpty()
  items: OrderItemDto[];

  // For a complete app, you would pass an addressId or the actual address details
  @IsString()
  @IsOptional()
  shippingAddressId?: string;
  
  @IsString()
  @IsOptional()
  shippingMethodId?: string;
}
