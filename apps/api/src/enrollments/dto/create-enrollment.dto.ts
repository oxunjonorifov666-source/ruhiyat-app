import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEnrollmentDto {
  @IsInt({ message: "centerId butun son bo'lishi kerak" })
  @Min(1)
  @Type(() => Number)
  centerId: number;

  @IsInt({ message: "studentId butun son bo'lishi kerak" })
  @Min(1)
  @Type(() => Number)
  studentId: number;

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
  requirePayment?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  paymentAmount?: number;
}
