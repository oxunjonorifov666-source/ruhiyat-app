import { IsString, Matches, Length } from 'class-validator';

export class RequestProfilePhoneChangeDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam formati noto'g'ri (+998XXXXXXXXX)" })
  newPhone: string;
}

export class ConfirmProfilePhoneChangeDto {
  @IsString()
  @Matches(/^\+998\d{9}$/, { message: "Telefon raqam formati noto'g'ri (+998XXXXXXXXX)" })
  newPhone: string;

  @IsString()
  @Length(6, 6, { message: "Kod 6 raqamdan iborat bo'lishi kerak" })
  code: string;
}
