import { IsOptional, IsString } from 'class-validator';

export class BlockDto {
  @IsOptional() @IsString() reason?: string;
}

export class QueryBlocksDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() targetType?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: string;
}

export class QueryBlockHistoryDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() targetType?: string;
  @IsOptional() @IsString() action?: string;
}
