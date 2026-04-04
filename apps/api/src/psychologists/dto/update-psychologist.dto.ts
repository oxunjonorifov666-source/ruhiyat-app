import { IsOptional, IsString, IsInt, IsBoolean, IsArray, Min, Max } from 'class-validator';

export class UpdatePsychologistDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  experienceYears?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
