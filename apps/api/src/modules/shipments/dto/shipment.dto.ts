import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  tracking?: string;
}

export class UpdateShipmentDto {
  @IsOptional()
  @IsString()
  carrier?: string;

  @IsOptional()
  @IsString()
  tracking?: string;
}
