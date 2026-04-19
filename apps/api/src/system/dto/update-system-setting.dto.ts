import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** PATCH /api/settings/:key */
export class UpdateSystemSettingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1_000_000)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  category?: string;
}
