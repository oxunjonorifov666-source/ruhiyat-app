import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class FinanceController {
  constructor(private readonly service: FinanceService) {}

  @Get('finance/stats')
  @Permissions('finance.read')
  getStats(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;
    return this.service.getStats(requester, targetCenterId as number);
  }

  @Get('finance/monthly-revenue')
  @Permissions('finance.read')
  getMonthlyRevenue(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;
    return this.service.getMonthlyRevenue(requester, targetCenterId as number);
  }

  @Get('finance/transactions-by-type')
  @Permissions('finance.read')
  getTransactionsByType(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;
    return this.service.getTransactionsByType(requester, targetCenterId as number);
  }

  @Get('finance/ledger')
  @Permissions('finance.read')
  getLedger(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('centerId') centerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getLedger(requester, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      dateFrom,
      dateTo,
      centerId: targetCenterId,
    });
  }

  @Get('payments')
  @Permissions('finance.read')
  findAllPayments(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('centerId') centerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.findAllPayments(requester, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search, status, method, dateFrom, dateTo, sortBy, sortOrder,
      centerId: targetCenterId,
    });
  }

  @Post('payments')
  @Permissions('finance.write')
  createPayment(
    @CurrentUser() requester: AuthUser,
    @Body() data: any
  ) {
    return this.service.createPayment(requester, data);
  }

  @Get('payments/:id')
  @Permissions('finance.read')
  findPayment(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;
    return this.service.findPayment(requester, id, targetCenterId as number);
  }

  @Patch('payments/:id')
  @Permissions('finance.write')
  updatePaymentStatus(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: PaymentStatus },
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;
    return this.service.updatePaymentStatus(requester, id, body, targetCenterId as number);
  }

  @Get('transactions')
  @Permissions('finance.read')
  findAllTransactions(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('centerId') centerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.findAllTransactions(requester, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search, type, status, method, dateFrom, dateTo, sortBy, sortOrder,
      centerId: targetCenterId,
    });
  }

  @Get('revenue')
  @Permissions('finance.read')
  findAllRevenue(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('source') source?: string,
    @Query('centerId') centerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.findAllRevenue(requester, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      source, dateFrom, dateTo,
      centerId: targetCenterId,
    });
  }
}
