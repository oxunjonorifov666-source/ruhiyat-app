import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('sessions')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get('stats')
  @Permissions('sessions.read')
  async getStats(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getStats(targetCenterId as number);
  }

  @Get('user')
  findByCurrentUser(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findByUser(requester.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
  }

  @Get('psychologist')
  findByCurrentPsychologist(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findByPsychologist(requester.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
  }

  @Get()
  @Permissions('sessions.read')
  async findAll(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('psychologistId') psychologistId?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      paymentStatus,
      psychologistId: psychologistId ? parseInt(psychologistId) : undefined,
      userId: userId ? parseInt(userId) : undefined,
      dateFrom,
      dateTo,
      centerId: targetCenterId as number,
    });
  }

  @Get(':id')
  @Permissions('sessions.read')
  findOne(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.findOne(id, targetCenterId as number);
  }

  @Post()
  @Permissions('sessions.write')
  create(@Body() data: any, @CurrentUser() requester: AuthUser) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? data.centerId
      : requester.centerId;

    return this.service.create({
      ...data,
      centerId: targetCenterId,
    });
  }

  @Patch(':id/accept')
  @Permissions('sessions.manage')
  accept(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.accept(id, targetCenterId as number);
  }

  @Patch(':id/reject')
  @Permissions('sessions.manage')
  reject(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.reject(id, targetCenterId as number);
  }

  @Patch(':id/cancel')
  @Permissions('sessions.manage')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: AuthUser,
    @Body() body: { cancelReason?: string },
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.cancel(id, requester.id, body?.cancelReason, targetCenterId as number);
  }

  @Patch(':id/complete')
  @Permissions('sessions.manage')
  complete(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.complete(id, targetCenterId as number);
  }
}
