import { IsOptional, IsString, IsEnum, IsNumberString, IsIn } from 'class-validator';

export class QueryUsersDto {
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
