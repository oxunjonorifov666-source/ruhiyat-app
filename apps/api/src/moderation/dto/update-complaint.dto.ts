import { IsString, IsOptional, IsEnum } from 'class-validator';

enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

enum ComplaintStatus {
  NEW = 'NEW',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export class UpdateComplaintDto {
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(Priority) priority?: string;
  @IsOptional() @IsEnum(ComplaintStatus) status?: string;
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
