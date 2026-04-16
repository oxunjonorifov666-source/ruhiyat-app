import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber() centerId: number;
  @IsNumber() studentId: number;
  @IsOptional() @IsNumber() enrollmentId?: number;
  @IsNumber() amount: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() status?: any; 
  @IsOptional() @IsString() method?: any;
  @IsOptional() @IsString() paymentDate?: string;
}
