import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { AdministratorsService } from './administrators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { QueryAdministratorsDto } from './dto/query-administrators.dto';
import { CreateAdministratorDto } from './dto/create-administrator.dto';
import { UpdateAdministratorDto } from './dto/update-administrator.dto';

@Controller('administrators')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdministratorsController {
  constructor(private readonly service: AdministratorsService) {}

  @Get()
  @Permissions('administrators.read')
  findAll(
    @CurrentUser() requester: AuthUser,
    @Query() query: QueryAdministratorsDto
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (query.centerId ? parseInt(query.centerId as any) : undefined)
      : requester.centerId;

    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page as any) : undefined,
      limit: query.limit ? parseInt(query.limit as any) : undefined,
      search: query.search,
      status: query.status,
      plan: query.plan,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      centerId: targetCenterId as number,
    });
  }

  @Get('stats')
  @Permissions('administrators.read')
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
  @Permissions('administrators.read')
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
  @Permissions('administrators.write')
  create(@CurrentUser() requester: AuthUser, @Body() data: CreateAdministratorDto) {
    return this.service.create(requester, data as any);
  }

  @Patch(':id')
  @Permissions('administrators.write')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId', ParseIntPipe) centerId: number,
    @Body() data: UpdateAdministratorDto,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? centerId
      : requester.centerId;

    return this.service.update(requester, id, targetCenterId as number, data);
  }

  @Patch(':id/status')
  @Permissions('administrators.write')
  setStatus(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId', ParseIntPipe) centerId: number,
    @Body('isActive') isActive: boolean,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? centerId
      : requester.centerId;

    return this.service.setStatus(requester, id, targetCenterId as number, isActive);
  }

  @Delete(':id')
  @Permissions('administrators.delete')
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
