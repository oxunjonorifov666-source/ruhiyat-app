import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, IsDateString, ArrayMaxSize } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(64)
  @MaxLength(200, { each: true })
  permissions?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
