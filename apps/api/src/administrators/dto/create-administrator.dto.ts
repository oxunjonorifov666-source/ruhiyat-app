import { IsOptional, IsString, IsInt, IsEmail, IsIn, MinLength, Matches } from 'class-validator';

export class CreateAdministratorDto {
  @IsString()
  @MinLength(2, { message: "Ism kamida 2 ta belgidan iborat bo'lishi kerak" })
  firstName: string;

  @IsString()
  @MinLength(2, { message: "Familiya kamida 2 ta belgidan iborat bo'lishi kerak" })
  lastName: string;

  @IsOptional()
  @IsEmail({}, { message: "Yaroqli email kiriting" })
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak" })
  phone?: string;

  @IsString()
  @MinLength(2, { message: "Markaz nomi kamida 2 ta belgidan iborat bo'lishi kerak" })
  centerName: string;

  @IsOptional()
  @IsString()
  centerDescription?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  centerPhone?: string;

  @IsOptional()
  @IsEmail({}, { message: "Yaroqli email kiriting" })
  centerEmail?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsIn(['BASIC', 'PREMIUM'])
  subscriptionPlan?: string;

  @IsOptional()
  @IsInt()
  userId?: number;
}
