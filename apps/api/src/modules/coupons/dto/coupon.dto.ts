import { IsString, IsNotEmpty, IsNumber, IsEnum, IsOptional, IsDateString, Min } from 'class-validator';

export enum CouponType {
  percentage = 'percentage',
  fixed = 'fixed'
}

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @Min(0)
  discount: number;

  @IsEnum(CouponType)
  type: CouponType;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;
}

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
