import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSecurityPolicyDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(6)
  @Max(64)
  passwordMinLength?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  passwordRequireUpperLowerDigit?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  passwordRequireSpecial?: boolean;
}
