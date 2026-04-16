import { IsString, IsOptional, IsInt, Min, MaxLength, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGroupDto {
  @IsOptional()
  @IsInt({ message: "courseId butun son bo'lishi kerak" })
  @Min(1)
  @Type(() => Number)
  courseId?: number;

  @IsOptional()
  @IsString({ message: "Nomi satr bo'lishi kerak" })
  @MaxLength(150, { message: "Nomi 150 belgidan qisqa bo'lishi kerak" })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  maxStudents?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
