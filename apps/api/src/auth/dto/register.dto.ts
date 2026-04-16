import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches, Length } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam formati noto'g'ri (+998XXXXXXXXX)" })
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Parol kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi kerak",
  })
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  /** Ro‘yxatdan o‘tishda SMS/email orqali kelgan 6 raqamli kod (`AUTH_SKIP_REGISTER_OTP=true` bo‘lsa ixtiyoriy) */
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Kod 6 raqamdan iborat bo‘lishi kerak' })
  code?: string;
}
