import { IsString, IsOptional, IsInt, Min, MaxLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsInt({ message: "courseId butun son bo'lishi kerak" })
  @Min(1)
  @Type(() => Number)
  courseId?: number;

  @IsOptional()
  @IsInt({ message: "groupId butun son bo'lishi kerak" })
  @Min(1)
  @Type(() => Number)
  groupId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
