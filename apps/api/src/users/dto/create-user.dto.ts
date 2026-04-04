import { IsOptional, IsString, IsEmail, IsEnum, MinLength, Matches } from 'class-validator';

enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMINISTRATOR = 'ADMINISTRATOR',
  MOBILE_USER = 'MOBILE_USER',
}

export class CreateUserDto {
  @IsOptional()
  @IsEmail({}, { message: "Yaroqli email kiriting" })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak" })
  phone?: string;

  @IsString()
  @MinLength(8, { message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" })
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsEnum(UserRole, { message: "Yaroqli rol tanlang" })
  role: string;
}
