import { IsOptional, IsString, IsIn, IsEmail } from 'class-validator';

export class UpdateAdministratorDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  centerName?: string;

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
  @IsIn(['BASIC', 'PREMIUM'])
  subscriptionPlan?: string;
}
