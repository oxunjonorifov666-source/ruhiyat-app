import { MeetingStatus, MeetingType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  description?: string;

  @IsOptional()
  @IsEnum(MeetingType)
  type?: MeetingType;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  meetingUrl?: string;

  @IsOptional()
  @IsBoolean()
  openBroadcast?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20_000)
  notes?: string;

  /** Superadmin only (service enforces). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostId?: number;
}
