import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: "Parol kamida 8 ta belgidan iborat bo'lishi kerak" })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Parol kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi kerak",
  })
  newPassword: string;
}
