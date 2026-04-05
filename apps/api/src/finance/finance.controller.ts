import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('finance/stats')
  @Permissions('finance.read')
  getStats() {
    return this.service.getStats();
  }

  @Get('finance/monthly-revenue')
  @Permissions('finance.read')
  getMonthlyRevenue() {
    return this.service.getMonthlyRevenue();
  }

  @Get('finance/transactions-by-type')
  @Permissions('finance.read')
  getTransactionsByType() {
    return this.service.getTransactionsByType();
  }

  @Get('payments')
  @Permissions('finance.read')
  findAllPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.service.findAllPayments({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search, status, method, dateFrom, dateTo, sortBy, sortOrder,
    });
  }

  @Post('payments')
  @Permissions('finance.write')
  createPayment(@Body() data: any) {
    return this.service.createPayment(data);
  }

  @Get('payments/:id')
  @Permissions('finance.read')
  findPayment(@Param('id', ParseIntPipe) id: number) {
    return this.service.findPayment(id);
  }

  @Get('transactions')
  @Permissions('finance.read')
  findAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.service.findAllTransactions({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search, type, status, method, dateFrom, dateTo, sortBy, sortOrder,
    });
  }

  @Get('revenue')
  @Permissions('finance.read')
  findAllRevenue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAllRevenue({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      source, dateFrom, dateTo,
    });
  }
}
