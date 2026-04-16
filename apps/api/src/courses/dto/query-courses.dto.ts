import { IsOptional, IsString, IsEnum, IsNumberString, IsIn } from 'class-validator';

export enum CourseStatusFilter {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  ALL = 'all',
}

export class QueryCoursesDto {
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
  @IsNumberString()
  centerId?: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE', 'ARCHIVED', 'all'])
  status?: string;

  @IsOptional()
  @IsIn(['createdAt', 'name', 'code', 'status'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
