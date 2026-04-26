import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  addressLine: string;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine?: string;
}
