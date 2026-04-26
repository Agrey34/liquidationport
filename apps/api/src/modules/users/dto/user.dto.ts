import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string; // This should generally be protected or handled carefully
}
