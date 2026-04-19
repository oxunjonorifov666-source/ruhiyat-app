import { IsString, MinLength, MaxLength } from 'class-validator';

export class VerifySessionPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
