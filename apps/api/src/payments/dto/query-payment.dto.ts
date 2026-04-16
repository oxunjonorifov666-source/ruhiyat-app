import { IsOptional, IsNumber, IsString } from 'class-validator';

export class QueryPaymentDto {
  @IsOptional() @IsNumber() page?: number;
  @IsOptional() @IsNumber() limit?: number;
  @IsOptional() @IsNumber() centerId?: number;
  @IsOptional() @IsNumber() studentId?: number;
  @IsOptional() @IsNumber() enrollmentId?: number;
  @IsOptional() @IsString() status?: string;
}
