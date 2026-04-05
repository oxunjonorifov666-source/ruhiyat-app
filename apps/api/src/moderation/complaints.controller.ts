import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto, AssignComplaintDto, ResolveComplaintDto, RejectComplaintDto } from './dto/update-complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplaintsController {
  constructor(private readonly service: ComplaintsService) {}

  @Get()
  @Permissions('complaints.read')
  findAll(@Query() query: QueryComplaintsDto) {
    return this.service.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      status: query.status,
      priority: query.priority,
      targetType: query.targetType,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('complaints.read')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @Permissions('complaints.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('complaints.read')
  create(@Body() data: CreateComplaintDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('complaints.manage')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateComplaintDto) {
    return this.service.update(id, data);
  }

  @Patch(':id/assign')
  @Permissions('complaints.manage')
  assign(@Param('id', ParseIntPipe) id: number, @Body() data: AssignComplaintDto) {
    return this.service.assign(id, data.assignedToUserId ?? null);
  }

  @Patch(':id/resolve')
  @Permissions('complaints.manage')
  resolve(@Param('id', ParseIntPipe) id: number, @Body() data: ResolveComplaintDto, @CurrentUser() user: any) {
    return this.service.resolve(id, user.userId, data.resolutionNote);
  }

  @Patch(':id/reject')
  @Permissions('complaints.manage')
  reject(@Param('id', ParseIntPipe) id: number, @Body() data: RejectComplaintDto, @CurrentUser() user: any) {
    return this.service.reject(id, user.userId, data.resolutionNote);
  }
}
