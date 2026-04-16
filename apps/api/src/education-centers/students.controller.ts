import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EducationCentersService } from './education-centers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('students')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class StudentsController {
  constructor(private readonly service: EducationCentersService) {}

  @Get()
  @Permissions('students.read')
  findAll(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getStudents(requester, targetCenterId as number, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Get(':id')
  @Permissions('students.read')
  findOne(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getStudent(requester, targetCenterId as number, id);
  }

  @Post()
  @Permissions('students.write')
  create(
    @CurrentUser() requester: AuthUser,
    @Body() data: any,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.createStudent(requester, targetCenterId as number, data);
  }

  @Patch(':id')
  @Permissions('students.write')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.updateStudent(requester, targetCenterId as number, id, data);
  }

  @Delete(':id')
  @Permissions('students.delete')
  remove(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.deleteStudent(requester, targetCenterId as number, id);
  }
}
