import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePaymentDto {
  @IsOptional() @IsNumber() amount?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() paymentDate?: string;
}
