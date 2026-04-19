import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  centerId?: number;
}
