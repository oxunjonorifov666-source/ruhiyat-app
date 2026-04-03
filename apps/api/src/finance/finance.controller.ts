import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('payments')
  findAllPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllPayments({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Post('payments')
  createPayment(@Body() data: any) { return this.service.createPayment(data); }

  @Get('payments/:id')
  findPayment(@Param('id', ParseIntPipe) id: number) { return this.service.findPayment(id); }

  @Get('transactions')
  findAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllTransactions({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('revenue')
  findAllRevenue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllRevenue({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }
}
