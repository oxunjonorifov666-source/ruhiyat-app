import { Allow, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { Prisma } from '@prisma/client';

/**
 * Superadmin: adjust integration row (explicit fields; `config` is Prisma JSON).
 */
export class UpdateIntegrationSettingDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  provider?: string;

  @IsOptional()
  @Allow()
  config?: Prisma.JsonValue;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
