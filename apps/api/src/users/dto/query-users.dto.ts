import { IsOptional, IsString, IsEnum, IsNumberString, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryUsersDto {
  /** Superadmin: filter by center. Other roles: ignored (own center enforced in service). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  centerId?: number;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'blocked', 'all'])
  status?: string;

  @IsOptional()
  @IsIn(['createdAt', 'lastLoginAt', 'firstName'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
