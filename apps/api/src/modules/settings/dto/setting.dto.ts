import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  value?: string;
}
