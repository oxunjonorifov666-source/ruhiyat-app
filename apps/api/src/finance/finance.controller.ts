import { Controller, Get, Post, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('payments')
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
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
  @Roles('SUPERADMIN', 'ADMINISTRATOR', 'MOBILE_USER')
  createPayment(@Body() data: any) { return this.service.createPayment(data); }

  @Get('payments/:id')
  @Roles('SUPERADMIN', 'ADMINISTRATOR', 'MOBILE_USER')
  findPayment(@Param('id', ParseIntPipe) id: number) { return this.service.findPayment(id); }

  @Get('transactions')
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
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
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
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
