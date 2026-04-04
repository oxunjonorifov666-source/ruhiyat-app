import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryAdministratorsDto {
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
  @IsIn(['active', 'inactive'])
  status?: string;

  @IsOptional()
  @IsIn(['BASIC', 'PREMIUM'])
  plan?: string;

  @IsOptional()
  @IsIn(['createdAt', 'name'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
