import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;
}
