import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('payments')
  @Permissions('finance.read')
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
  @Permissions('finance.write')
  createPayment(@Body() data: any) { return this.service.createPayment(data); }

  @Get('payments/:id')
  @Permissions('finance.read')
  findPayment(@Param('id', ParseIntPipe) id: number) { return this.service.findPayment(id); }

  @Get('transactions')
  @Permissions('finance.read')
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
  @Permissions('finance.read')
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
