import { IsOptional, IsString, IsBoolean, IsEnum, IsEmail, Matches } from 'class-validator';

enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMINISTRATOR = 'ADMINISTRATOR',
  MOBILE_USER = 'MOBILE_USER',
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Yaroqli email kiriting" })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak" })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(UserRole, { message: "Yaroqli rol tanlang" })
  role?: string;
}
