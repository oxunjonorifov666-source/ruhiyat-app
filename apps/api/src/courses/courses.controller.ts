import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('courses')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get()
  @Permissions('courses.read')
  findAll(@CurrentUser() requester: AuthUser, @Query() query: QueryCoursesDto) {
    return this.service.findAll(requester, {
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      centerId: query.centerId ? parseInt(query.centerId) : undefined,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('courses.read')
  getStats(@CurrentUser() requester: AuthUser, @Query('centerId') centerId?: string) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.getStats(requester, targetCenterId as number);
  }

  @Get(':id')
  @Permissions('courses.read')
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
  @Permissions('courses.write')
  create(@CurrentUser() requester: AuthUser, @Body() data: CreateCourseDto) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? data.centerId
      : requester.centerId;

    return this.service.create(requester, targetCenterId as number, data);
  }

  @Patch(':id')
  @Permissions('courses.write')
  update(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCourseDto,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? parseInt(centerId) : undefined)
      : requester.centerId;

    return this.service.update(requester, id, targetCenterId as number, data);
  }

  @Delete(':id')
  @Permissions('courses.delete')
  remove(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('centerId', ParseIntPipe) centerId: number,
  ) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN 
      ? (centerId ? centerId : undefined)
      : requester.centerId;

    return this.service.remove(requester, id, targetCenterId as number);
  }
}
