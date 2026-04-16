import { IsString, IsOptional, IsEnum, IsInt, Min, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { CourseStatus } from './create-course.dto';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_\-]*$/i, { message: 'Kurs kodi faqat harf, raqam, _ yoki - bo\'lishi kerak' })
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(CourseStatus, { message: 'Yaroqli holat tanlang: DRAFT, ACTIVE, ARCHIVED' })
  status?: CourseStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationWeeks?: number;
}
