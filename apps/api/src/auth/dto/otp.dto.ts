import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  purpose: string;
}

export class VerifyOtpDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  code: string;

  @IsString()
  purpose: string;
}
