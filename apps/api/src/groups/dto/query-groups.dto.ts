import { IsString, IsOptional } from 'class-validator';

export class QueryGroupsDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  centerId?: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
