import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 20;

  get skip(): number {
    const page = Math.max(1, this.page ?? 1);
    const limit = Math.min(200, Math.max(1, this.limit ?? 20));
    return (page - 1) * limit;
  }

  get take(): number {
    return Math.min(200, Math.max(1, this.limit ?? 20));
  }
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  page = 1,
  limit = 20,
): PaginatedResult<T> {
  const safeLimit = Math.min(200, Math.max(1, limit));
  const safePage = Math.max(1, page);
  return {
    items,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}
