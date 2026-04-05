import { IsOptional, IsString } from 'class-validator';

export class QueryContentModerationDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() contentType?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: string;
}

export class ModerationActionDto {
  @IsOptional() @IsString() moderatorNote?: string;
}
