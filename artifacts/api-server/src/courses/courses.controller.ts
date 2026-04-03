import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get('courses')
  findAllCourses() { return this.service.findAllCourses(); }

  @Get('courses/:id')
  findCourse(@Param('id', ParseIntPipe) id: number) { return this.service.findCourse(id); }

  @Post('courses')
  createCourse(@Body() data: any) { return this.service.createCourse(data); }

  @Patch('courses/:id')
  updateCourse(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateCourse(id, data); }

  @Delete('courses/:id')
  removeCourse(@Param('id', ParseIntPipe) id: number) { return this.service.removeCourse(id); }

  @Get('groups')
  findAllGroups() { return this.service.findAllGroups(); }

  @Post('groups')
  createGroup(@Body() data: any) { return this.service.createGroup(data); }

  @Get('enrollments')
  findAllEnrollments() { return this.service.findAllEnrollments(); }

  @Post('enrollments')
  createEnrollment(@Body() data: any) { return this.service.createEnrollment(data); }
}
