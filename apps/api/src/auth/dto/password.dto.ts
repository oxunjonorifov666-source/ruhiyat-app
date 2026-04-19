import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches, Length } from 'class-validator';

/** Kamida bittasi: email yoki telefon (mobil ilova asosan telefon) */
export class RequestPasswordResetDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: "Telefon +998901234567 ko'rinishida bo'lishi kerak",
  })
  phone?: string;
}

export class VerifyPasswordResetOtpDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, {
    message: "Telefon +998901234567 ko'rinishida bo'lishi kerak",
  })
  phone?: string;

  @IsString()
  @Length(6, 6, { message: "Kod 6 raqam bo'lishi kerak" })
  @Matches(/^\d+$/)
  code: string;
}

export class ResetPasswordDto {
  /** verify qadamidan keyin JWT (tavsiya etiladi) */
  @IsOptional()
  @IsString()
  resetToken?: string;

  /** eski bir bosqichli oqim: 6 raqamli kod */
  @IsOptional()
  @IsString()
  token?: string;

  @IsString()
  @MinLength(8, { message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Parol kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi kerak",
  })
  newPassword: string;
}

export class RefreshTokenDto {
  /** Optional when refresh is sent via HttpOnly cookie (browser clients). */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class LogoutDto {
  /** Optional when refresh is sent via HttpOnly cookie (browser clients). */
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
