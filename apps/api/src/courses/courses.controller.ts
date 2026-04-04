import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get('courses')
  findAllCourses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('centerId') centerId?: string,
  ) {
    return this.service.findAllCourses({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      centerId: centerId ? parseInt(centerId) : undefined,
    });
  }

  @Get('courses/:id')
  findCourse(@Param('id', ParseIntPipe) id: number) { return this.service.findCourse(id); }

  @Post('courses')
  @UseGuards(PermissionsGuard)
  @Permissions('courses.write')
  createCourse(@Body() data: any) { return this.service.createCourse(data); }

  @Patch('courses/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('courses.write')
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateCourse(id, data); }

  @Delete('courses/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('courses.delete')
  removeCourse(@Param('id', ParseIntPipe) id: number) { return this.service.removeCourse(id); }

  @Get('groups')
  findAllGroups(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('centerId') centerId?: string,
  ) {
    return this.service.findAllGroups({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      centerId: centerId ? parseInt(centerId) : undefined,
    });
  }

  @Post('groups')
  @UseGuards(PermissionsGuard)
  @Permissions('courses.write')
  createGroup(@Body() data: any) { return this.service.createGroup(data); }

  @Get('enrollments')
  findAllEnrollments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAllEnrollments({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('enrollments')
  @UseGuards(PermissionsGuard)
  @Permissions('courses.write')
  createEnrollment(@Body() data: any) { return this.service.createEnrollment(data); }
}
