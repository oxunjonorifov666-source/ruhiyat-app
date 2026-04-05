import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get('stats')
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.read')
  getStats() {
    return this.service.getStats();
  }

  @Get('user')
  findByCurrentUser(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findByUser(user.userId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
  }

  @Get('psychologist')
  findByCurrentPsychologist(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findByPsychologist(user.userId, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      status,
    });
  }

  @Get()
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.read')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('psychologistId') psychologistId?: string,
    @Query('userId') userId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
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
    });
  }

  @Get(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.write')
  create(@Body() data: any, @CurrentUser() user: any) {
    return this.service.create({
      ...data,
      administratorId: data.administratorId || undefined,
    });
  }

  @Patch(':id/accept')
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.manage')
  accept(@Param('id', ParseIntPipe) id: number) {
    return this.service.accept(id);
  }

  @Patch(':id/reject')
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.manage')
  reject(@Param('id', ParseIntPipe) id: number) {
    return this.service.reject(id);
  }

  @Patch(':id/cancel')
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.manage')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() body: { cancelReason?: string },
  ) {
    return this.service.cancel(id, user.userId, body?.cancelReason);
  }

  @Patch(':id/complete')
  @UseGuards(PermissionsGuard)
  @Permissions('sessions.manage')
  complete(@Param('id', ParseIntPipe) id: number) {
    return this.service.complete(id);
  }
}
