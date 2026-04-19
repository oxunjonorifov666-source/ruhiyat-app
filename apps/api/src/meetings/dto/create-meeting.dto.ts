import { MeetingStatus, MeetingType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Create meeting body: only these fields are accepted.
 * `hostId` is read only for superadmin in `MeetingsService.create`.
 */
export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title: string;

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

  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration: number;

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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  hostId?: number;
}
