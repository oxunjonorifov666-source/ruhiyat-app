import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentDto } from './dto/query-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @Permissions('payments.create')
  create(@CurrentUser() requester: AuthUser, @Body() dto: CreatePaymentDto, @Query('centerId') centerId?: string) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.create(requester, targetCenterId as number, dto);
  }

  @Get()
  @Permissions('payments.view')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryPaymentDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (query.centerId ? parseInt(query.centerId as any) : undefined)
      : requester.centerId;

    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page as any) : undefined,
      limit: query.limit ? parseInt(query.limit as any) : undefined,
      centerId: targetCenterId as number,
      studentId: query.studentId ? parseInt(query.studentId as any) : undefined,
      enrollmentId: query.enrollmentId ? parseInt(query.enrollmentId as any) : undefined,
      status: query.status,
    });
  }

  @Get('analytics')
  @Permissions('payments.view')
  getAnalytics(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getAnalytics(requester, targetCenterId as number);
  }

  @Get(':id')
  @Permissions('payments.view')
  findOne(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId as any) : undefined)
      : requester.centerId;

    return this.service.findOne(requester, id, targetCenterId as number);
  }

  @Patch(':id')
  @Permissions('payments.update')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId as any) : undefined)
      : requester.centerId;

    return this.service.update(requester, id, targetCenterId as number, dto);
  }
}
