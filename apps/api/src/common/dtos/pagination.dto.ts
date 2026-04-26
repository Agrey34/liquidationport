import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { SYSTEM_DEFAULTS } from '../constants/system.constant';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = SYSTEM_DEFAULTS.PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(SYSTEM_DEFAULTS.PAGINATION.MAX_LIMIT)
  limit?: number = SYSTEM_DEFAULTS.PAGINATION.DEFAULT_LIMIT;
}
