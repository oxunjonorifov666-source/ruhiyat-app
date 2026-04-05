import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateReportDto {
  @IsString() type: string;
  @IsString() targetType: string;
  @IsInt() targetId: number;
  @IsString() summary: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsEnum(Severity) severity?: string;
  @IsOptional() @IsInt() assignedToUserId?: number;
}

export class UpdateReportDto {
  @IsOptional() @IsString() summary?: string;
  @IsOptional() @IsString() details?: string;
  @IsOptional() @IsEnum(Severity) severity?: string;
  @IsOptional() @IsInt() assignedToUserId?: number;
}

export class ResolveReportDto {
  @IsOptional() @IsString() resolutionNote?: string;
}
