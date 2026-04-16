import { IsString, IsOptional, IsInt, IsBoolean, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAnswerDto {
  @IsString()
  text: string;

  @IsBoolean()
  @IsOptional()
  isCorrect?: boolean;

  @IsInt()
  @IsOptional()
  score?: number;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerDto)
  answers: CreateAnswerDto[];
}

export class CreateTestDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsInt()
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}
