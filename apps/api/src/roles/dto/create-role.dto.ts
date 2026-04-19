import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Superadmin: target center; for center admin, value is always ignored (service forces own center). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  centerId?: number;
}
