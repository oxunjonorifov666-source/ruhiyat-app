import { IsString, IsOptional, IsEnum } from 'class-validator';

enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export class UpdateComplaintDto {
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(Priority) priority?: string;
}

export class AssignComplaintDto {
  @IsOptional() assignedToUserId?: number | null;
}

export class ResolveComplaintDto {
  @IsOptional() @IsString() resolutionNote?: string;
}

export class RejectComplaintDto {
  @IsOptional() @IsString() resolutionNote?: string;
}
