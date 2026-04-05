import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryReportsDto } from './dto/query-reports.dto';
import { CreateReportDto, UpdateReportDto, ResolveReportDto } from './dto/create-report.dto';

@Controller('moderation-reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get()
  @Permissions('reports.read')
  findAll(@Query() query: QueryReportsDto) {
    return this.service.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      status: query.status,
      severity: query.severity,
      type: query.type,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('reports.read')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @Permissions('reports.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('reports.manage')
  create(@Body() data: CreateReportDto, @CurrentUser() user: any) {
    return this.service.create(data, user.userId);
  }

  @Patch(':id')
  @Permissions('reports.manage')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateReportDto) {
    return this.service.update(id, data);
  }

  @Patch(':id/resolve')
  @Permissions('reports.manage')
  resolve(@Param('id', ParseIntPipe) id: number, @Body() data: ResolveReportDto, @CurrentUser() user: any) {
    return this.service.resolve(id, user.userId, data.resolutionNote);
  }
}
