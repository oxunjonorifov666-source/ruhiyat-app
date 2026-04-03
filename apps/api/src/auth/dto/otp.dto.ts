import { IsEmail, IsOptional, IsString, IsIn, Length, Matches } from 'class-validator';

const OTP_PURPOSES = ['login', 'registration', 'verification', 'password_reset'] as const;

export class SendOtpDto {
  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam formati noto'g'ri" })
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsIn(OTP_PURPOSES, { message: "Noto'g'ri maqsad turi" })
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
  @Length(6, 6, { message: "Kod 6 raqamdan iborat bo'lishi kerak" })
  code: string;

  @IsString()
  @IsIn(OTP_PURPOSES, { message: "Noto'g'ri maqsad turi" })
  purpose: string;
}
