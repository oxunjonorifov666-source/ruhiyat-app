import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe, UseGuards
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Get()
  @Permissions('enrollments.read')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryEnrollmentsDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (query.centerId ? parseInt(query.centerId as any) : undefined)
      : requester.centerId;

    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page as any) : undefined,
      limit: query.limit ? parseInt(query.limit as any) : undefined,
      search: query.search,
      centerId: targetCenterId as number,
      studentId: query.studentId ? parseInt(query.studentId as any) : undefined,
      courseId: query.courseId ? parseInt(query.courseId as any) : undefined,
      groupId: query.groupId ? parseInt(query.groupId as any) : undefined,
      status: query.status,
    });
  }

  @Get('analytics')
  @Permissions('enrollments.read')
  getAnalytics(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') centerId?: string,
    @Query('courseId') courseId?: string,
    @Query('groupId') groupId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getAnalytics(
      requester,
      targetCenterId as number,
      courseId ? parseInt(courseId) : undefined,
      groupId ? parseInt(groupId) : undefined
    );
  }

  @Get(':id')
  @Permissions('enrollments.read')
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
  @Permissions('enrollments.write')
  create(@CurrentUser() requester: AuthUser, @Body() data: CreateEnrollmentDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? data.centerId
      : requester.centerId;

    return this.service.create(requester, targetCenterId as number, data);
  }

  @Patch(':id')
  @Permissions('enrollments.write')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateEnrollmentDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.update(requester, id, targetCenterId as number, data);
  }

  @Delete(':id')
  @Permissions('enrollments.delete')
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
