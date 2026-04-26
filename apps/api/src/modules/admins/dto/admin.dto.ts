import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateAdminDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role?: string;
}
