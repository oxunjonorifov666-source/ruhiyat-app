import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BlockUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Sabab 500 belgidan oshmasligi kerak" })
  reason?: string;
}
