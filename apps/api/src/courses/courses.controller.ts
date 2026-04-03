import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  createCourse(@Body() data: any) { return this.service.createCourse(data); }

  @Patch('courses/:id')
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateCourse(id, data); }

  @Delete('courses/:id')
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
  createEnrollment(@Body() data: any) { return this.service.createEnrollment(data); }
}
