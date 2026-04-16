import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { QueryGroupsDto } from './dto/query-groups.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('groups')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  @Get()
  @Permissions('groups.read')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryGroupsDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (query.centerId ? parseInt(query.centerId as any) : undefined)
      : requester.centerId;

    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page as any) : undefined,
      limit: query.limit ? parseInt(query.limit as any) : undefined,
      search: query.search,
      centerId: targetCenterId as number,
      courseId: query.courseId ? parseInt(query.courseId as any) : undefined,
    });
  }

  @Get(':id')
  @Permissions('groups.read')
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

  @Get(':id/analytics')
  @Permissions('groups.read')
  getAnalytics(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getAnalytics(requester, id, targetCenterId as number);
  }

  @Post()
  @Permissions('groups.write')
  create(@CurrentUser() requester: AuthUser, @Body() data: CreateGroupDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? data.centerId
      : requester.centerId;

    return this.service.create(requester, targetCenterId as number, data);
  }

  @Patch(':id')
  @Permissions('groups.write')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateGroupDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.update(requester, id, targetCenterId as number, data);
  }

  @Delete(':id')
  @Permissions('groups.delete')
  remove(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId', ParseIntPipe) centerId: number,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? centerId
      : requester.centerId;

    return this.service.remove(requester, id, targetCenterId as number);
  }
}
