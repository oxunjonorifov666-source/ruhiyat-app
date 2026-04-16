import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { QueryComplaintsDto } from './dto/query-complaints.dto';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto, AssignComplaintDto, ResolveComplaintDto, RejectComplaintDto } from './dto/update-complaint.dto';

@Controller('complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class ComplaintsController {
  constructor(private readonly service: ComplaintsService) {}

  private targetCenterId(requester: AuthUser, queryCenterId?: string): number | undefined {
    return requester.role === UserRole.SUPERADMIN
      ? queryCenterId
        ? parseInt(queryCenterId, 10)
        : undefined
      : requester.centerId ?? undefined;
  }

  @Get()
  @Permissions('complaints.read')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryComplaintsDto) {
    const centerId = this.targetCenterId(requester, query.centerId);
    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
      search: query.search,
      status: query.status,
      priority: query.priority,
      targetType: query.targetType,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      centerId,
    });
  }

  @Get('stats')
  @Permissions('complaints.read')
  getStats(@CurrentUser() requester: AuthUser, @Query('centerId') centerId?: string) {
    const cid = this.targetCenterId(requester, centerId);
    return this.service.getStats(requester, cid);
  }

  @Get(':id')
  @Permissions('complaints.read')
  findOne(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.targetCenterId(requester, centerId);
    return this.service.findOne(requester, id, cid);
  }

  @Post()
  @Permissions('complaints.read')
  create(@Body() data: CreateComplaintDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('complaints.manage')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateComplaintDto,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.targetCenterId(requester, centerId);
    return this.service.update(requester, id, cid, data);
  }

  @Patch(':id/assign')
  @Permissions('complaints.manage')
  assign(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AssignComplaintDto,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.targetCenterId(requester, centerId);
    return this.service.assign(requester, id, data.assignedToUserId ?? null, cid);
  }

  @Patch(':id/resolve')
  @Permissions('complaints.manage')
  resolve(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ResolveComplaintDto,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.targetCenterId(requester, centerId);
    return this.service.resolve(requester, id, requester.id, data.resolutionNote, cid);
  }

  @Patch(':id/reject')
  @Permissions('complaints.manage')
  reject(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RejectComplaintDto,
    @Query('centerId') centerId?: string,
  ) {
    const cid = this.targetCenterId(requester, centerId);
    return this.service.reject(requester, id, requester.id, data.resolutionNote, cid);
  }
}
