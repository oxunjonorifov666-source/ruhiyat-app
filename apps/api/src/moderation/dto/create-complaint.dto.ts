import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';

enum TargetType {
  PSYCHOLOGIST = 'psychologist',
  ADMINISTRATOR = 'administrator',
  CONTENT = 'content',
  SESSION = 'session',
}

enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class CreateComplaintDto {
  @IsInt() reporterId: number;
  @IsEnum(TargetType) targetType: string;
  @IsInt() targetId: number;
  @IsString() subject: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(Priority) priority?: string;
}
