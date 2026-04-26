import { PaginationDto } from '../dtos/pagination.dto';

export interface PaginationResult {
  skip: number;
  take: number;
}

export function getPaginationParams(paginationDto: PaginationDto): PaginationResult {
  const page = paginationDto.page || 1;
  const limit = paginationDto.limit || 10;
  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
  };
}

export function buildPaginationMeta(total: number, paginationDto: PaginationDto) {
  const page = paginationDto.page || 1;
  const limit = paginationDto.limit || 10;
  const lastPage = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    lastPage,
    hasNextPage: page < lastPage,
    hasPreviousPage: page > 1,
  };
}
