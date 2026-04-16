import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { PsychologistsService } from './psychologists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { QueryPsychologistsDto } from './dto/query-psychologists.dto';
import { CreatePsychologistDto } from './dto/create-psychologist.dto';
import { UpdatePsychologistDto } from './dto/update-psychologist.dto';
import { RejectPsychologistDto } from './dto/verify-psychologist.dto';

@Controller('psychologists')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class PsychologistsController {
  constructor(private readonly service: PsychologistsService) {}

  @Get()
  @Permissions('psychologists.read')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryPsychologistsDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (query.centerId ? parseInt(query.centerId as any) : undefined)
      : requester.centerId;

    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page as any) : undefined,
      limit: query.limit ? parseInt(query.limit as any) : undefined,
      search: query.search,
      specialization: query.specialization,
      status: query.status,
      minRating: query.minRating ? parseFloat(query.minRating as any) : undefined,
      minExperience: query.minExperience ? parseInt(query.minExperience as any) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      centerId: targetCenterId as number,
    });
  }

  @Get('stats')
  @Permissions('psychologists.read')
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
  @Permissions('psychologists.read')
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
  @Permissions('psychologists.write')
  create(@CurrentUser() requester: AuthUser, @Body() data: CreatePsychologistDto) {
    return this.service.create(requester, data);
  }

  @Patch(':id')
  @Permissions('psychologists.write')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePsychologistDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.update(requester, id, targetCenterId as number | undefined, data);
  }

  @Patch(':id/verify')
  @Permissions('psychologists.manage')
  verify(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.verify(requester, id, targetCenterId as number | undefined);
  }

  @Patch(':id/reject')
  @Permissions('psychologists.manage')
  reject(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RejectPsychologistDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.reject(requester, id, targetCenterId as number | undefined, data.reason);
  }

  @Delete(':id')
  @Permissions('psychologists.delete')
  remove(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.remove(requester, id, targetCenterId as number | undefined);
  }

  @Post(':id/assign/:centerId')
  @Permissions('psychologists.manage')
  assignToCenter(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('centerId', ParseIntPipe) centerId: number,
  ) {
    return this.service.assignToCenter(requester, id, centerId);
  }

  @Delete(':id/unassign/:centerId')
  @Permissions('psychologists.manage')
  unassignFromCenter(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Param('centerId', ParseIntPipe) centerId: number,
  ) {
    return this.service.unassignFromCenter(requester, id, centerId);
  }
}
