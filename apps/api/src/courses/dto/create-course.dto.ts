import { IsString, IsOptional, IsEnum, IsInt, Min, MinLength, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export enum CourseStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class CreateCourseDto {
  @IsInt({ message: 'centerId butun son bo\'lishi kerak' })
  @Min(1)
  @Type(() => Number)
  centerId: number;

  @IsString()
  @MinLength(2, { message: 'Kurs nomi kamida 2 ta belgidan iborat bo\'lishi kerak' })
  @MaxLength(200, { message: 'Kurs nomi 200 ta belgidan oshmasligi kerak' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Kurs kodi 50 ta belgidan oshmasligi kerak' })
  @Matches(/^[A-Z0-9_\-]*$/i, { message: 'Kurs kodi faqat harf, raqam, _ yoki - bo\'lishi kerak' })
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Tavsif 2000 ta belgidan oshmasligi kerak' })
  description?: string;

  @IsOptional()
  @IsEnum(CourseStatus, { message: 'Yaroqli holat tanlang: DRAFT, ACTIVE, ARCHIVED' })
  status?: CourseStatus;

  @IsOptional()
  @IsInt({ message: 'durationWeeks butun son bo\'lishi kerak' })
  @Min(1)
  @Type(() => Number)
  durationWeeks?: number;
}
