import { Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('payments')
  findAllPayments() { return this.service.findAllPayments(); }

  @Post('payments')
  createPayment(@Body() data: any) { return this.service.createPayment(data); }

  @Get('payments/:id')
  findPayment(@Param('id', ParseIntPipe) id: number) { return this.service.findPayment(id); }

  @Get('transactions')
  findAllTransactions() { return this.service.findAllTransactions(); }

  @Get('revenue')
  findAllRevenue() { return this.service.findAllRevenue(); }
}
