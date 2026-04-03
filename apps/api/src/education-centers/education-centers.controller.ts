import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EducationCentersService } from './education-centers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('education-centers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EducationCentersController {
  constructor(private readonly service: EducationCentersService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('SUPERADMIN')
  create(@Body() data: any) { return this.service.create(data); }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  @Roles('SUPERADMIN')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Get(':id/staff')
  getStaff(@Param('id', ParseIntPipe) id: number) { return this.service.getStaff(id); }

  @Get(':id/students')
  getStudents(@Param('id', ParseIntPipe) id: number) { return this.service.getStudents(id); }

  @Get(':id/teachers')
  getTeachers(@Param('id', ParseIntPipe) id: number) { return this.service.getTeachers(id); }

  @Get(':id/courses')
  getCourses(@Param('id', ParseIntPipe) id: number) { return this.service.getCourses(id); }
}
