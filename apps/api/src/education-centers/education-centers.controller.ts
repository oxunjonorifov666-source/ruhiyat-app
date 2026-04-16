import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { EducationCentersService } from './education-centers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';

@Controller('education-centers')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class EducationCentersController {
  constructor(private readonly service: EducationCentersService) {}

  @Get()
  @Permissions('centers.read')
  findAll(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(requester, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Get(':id')
  @Permissions('centers.read')
  findOne(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ) { 
    return this.service.findOne(requester, id); 
  }

  @Post()
  @Permissions('centers.write')
  create(
    @CurrentUser() requester: AuthUser,
    @Body() data: any
  ) { 
    return this.service.create(requester, data); 
  }

  @Patch(':id')
  @Permissions('centers.write')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.update(requester, id, data);
  }

  @Delete(':id')
  @Permissions('centers.delete')
  remove(
    @CurrentUser() requester: AuthUser,
    @Param('id', ParseIntPipe) id: number
  ) { 
    return this.service.remove(requester, id); 
  }

  @Get(':id/staff')
  @Permissions('centers.read')
  async getStaff(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getStaff(requester, id, { 
      page: page ? parseInt(page) : undefined, 
      limit: limit ? parseInt(limit) : undefined, 
      search 
    });
  }

  @Get(':id/students')
  @Permissions('centers.read')
  async getStudents(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getStudents(requester, id, { 
      page: page ? parseInt(page) : undefined, 
      limit: limit ? parseInt(limit) : undefined, 
      search 
    });
  }

  @Get(':id/teachers')
  @Permissions('centers.read')
  async getTeachers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getTeachers(requester, id, { 
      page: page ? parseInt(page) : undefined, 
      limit: limit ? parseInt(limit) : undefined, 
      search 
    });
  }

  @Get(':id/courses')
  @Permissions('centers.read')
  async getCourses(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getCourses(requester, id, { 
      page: page ? parseInt(page) : undefined, 
      limit: limit ? parseInt(limit) : undefined, 
      search 
    });
  }

  @Post(':id/students')
  @Permissions('centers.write')
  async createStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.createStudent(requester, id, data);
  }

  @Patch(':id/students/:sid')
  @Permissions('centers.write')
  async updateStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('sid', ParseIntPipe) sid: number,
    @Body() data: any,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.updateStudent(requester, id, sid, data);
  }

  @Delete(':id/students/:sid')
  @Permissions('centers.delete')
  async deleteStudent(
    @Param('id', ParseIntPipe) id: number,
    @Param('sid', ParseIntPipe) sid: number,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.deleteStudent(requester, id, sid);
  }

  @Post(':id/teachers')
  @Permissions('centers.write')
  async createTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.createTeacher(requester, id, data);
  }

  @Patch(':id/teachers/:tid')
  @Permissions('centers.write')
  async updateTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Param('tid', ParseIntPipe) tid: number,
    @Body() data: any,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.updateTeacher(requester, id, tid, data);
  }

  @Delete(':id/teachers/:tid')
  @Permissions('centers.delete')
  async deleteTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Param('tid', ParseIntPipe) tid: number,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.deleteTeacher(requester, id, tid);
  }

  @Post(':id/courses')
  @Permissions('centers.write')
  async createCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.createCourse(requester, id, data);
  }
}
