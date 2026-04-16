import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';

export class QueryPsychologistsDto {
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
  specialization?: string;

  @IsOptional()
  @IsNumberString()
  centerId?: string;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'REJECTED'])
  status?: string;

  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @IsOptional()
  @IsNumberString()
  minExperience?: string;

  @IsOptional()
  @IsIn(['createdAt', 'rating', 'experienceYears', 'firstName'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}
