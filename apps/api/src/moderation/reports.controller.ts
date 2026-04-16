import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { QueryReportsDto } from './dto/query-reports.dto';
import { CreateReportDto, UpdateReportDto, ResolveReportDto } from './dto/create-report.dto';

@Controller('moderation-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  @Permissions('reports.read')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryReportsDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (query.centerId ? parseInt(query.centerId as any) : undefined)
      : requester.centerId;

    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page as any) : undefined,
      limit: query.limit ? parseInt(query.limit as any) : undefined,
      search: query.search,
      status: query.status,
      severity: query.severity,
      type: query.type,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      centerId: targetCenterId as number,
    });
  }

  @Get('stats')
  @Permissions('reports.read')
  getStats(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getStats(requester, targetCenterId as number);
  }

  @Get(':id')
  @Permissions('reports.read')
  findOne(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.findOne(requester, id, targetCenterId as number);
  }

  @Post()
  @Permissions('reports.manage')
  create(@CurrentUser() requester: AuthUser, @Body() data: CreateReportDto) {
    return this.service.create(requester, data);
  }

  @Patch(':id')
  @Permissions('reports.manage')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateReportDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId =
      requester.role === UserRole.SUPERADMIN
        ? centerId
          ? parseInt(centerId, 10)
          : undefined
        : requester.centerId ?? undefined;

    return this.service.update(requester, id, targetCenterId, data);
  }

  @Patch(':id/resolve')
  @Permissions('reports.manage')
  resolve(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ResolveReportDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId =
      requester.role === UserRole.SUPERADMIN
        ? centerId
          ? parseInt(centerId, 10)
          : undefined
        : requester.centerId ?? undefined;

    return this.service.resolve(requester, id, targetCenterId, data.resolutionNote);
  }
}
