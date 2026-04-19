import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** PATCH /api/mobile-settings/:key */
export class UpdateMobileAppSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1_000_000)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  platform?: string;
}
