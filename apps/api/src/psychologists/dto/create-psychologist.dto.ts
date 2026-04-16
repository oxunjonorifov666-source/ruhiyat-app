import { IsOptional, IsString, IsInt, IsEmail, IsArray, Min, Max, Matches, MinLength } from 'class-validator';

export class CreatePsychologistDto {
  @IsString()
  @MinLength(2, { message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak" })
  firstName: string;

  @IsString()
  @MinLength(2, { message: "Familiya kamida 2 ta belgidan iborat bo'lishi kerak" })
  lastName: string;

  @IsOptional()
  @IsEmail({}, { message: "Yaroqli email kiriting" })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak" })
  phone?: string;

  @IsOptional()
  @IsString()
  patronymic?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

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
  @Max(200)
  age?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsInt()
  centerId?: number;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
