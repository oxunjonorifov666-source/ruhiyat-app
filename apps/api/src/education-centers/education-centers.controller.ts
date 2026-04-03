import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, ForbiddenException } from '@nestjs/common';
import { EducationCentersService } from './education-centers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('education-centers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EducationCentersController {
  constructor(
    private readonly service: EducationCentersService,
    private readonly prisma: PrismaService,
  ) {}

  private async verifyCenterAccess(userId: number, role: string, centerId: number): Promise<void> {
    if (role === 'SUPERADMIN') return;
    if (role === 'ADMINISTRATOR') {
      const admin = await this.prisma.administrator.findFirst({
        where: { userId, centerId },
      });
      if (!admin) throw new ForbiddenException("Siz ushbu markazga kirishga ruxsatingiz yo'q");
    }
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  @Roles('SUPERADMIN')
  create(@Body() data: any) { return this.service.create(data); }

  @Patch(':id')
  @Roles('SUPERADMIN', 'ADMINISTRATOR')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles('SUPERADMIN')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Get(':id/staff')
  async getStaff(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: { userId: number; role: string },
  ) {
    if (currentUser) await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.getStaff(id, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined, search });
  }

  @Get(':id/students')
  async getStudents(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: { userId: number; role: string },
  ) {
    if (currentUser) await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.getStudents(id, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined, search });
  }

  @Get(':id/teachers')
  async getTeachers(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: { userId: number; role: string },
  ) {
    if (currentUser) await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.getTeachers(id, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined, search });
  }

  @Get(':id/courses')
  async getCourses(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: { userId: number; role: string },
  ) {
    if (currentUser) await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.getCourses(id, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined, search });
  }

  @Get(':id/groups')
  async getGroups(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @CurrentUser() currentUser?: { userId: number; role: string },
  ) {
    if (currentUser) await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.getGroups(id, { page: page ? parseInt(page) : undefined, limit: limit ? parseInt(limit) : undefined, search });
  }

  @Post(':id/students')
  @Roles('ADMINISTRATOR', 'SUPERADMIN')
  async createStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.createStudent(id, data);
  }

  @Post(':id/teachers')
  @Roles('ADMINISTRATOR', 'SUPERADMIN')
  async createTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.createTeacher(id, data);
  }

  @Post(':id/courses')
  @Roles('ADMINISTRATOR', 'SUPERADMIN')
  async createCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.createCourse(id, data);
  }

  @Post(':id/groups')
  @Roles('ADMINISTRATOR', 'SUPERADMIN')
  async createGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    await this.verifyCenterAccess(currentUser.userId, currentUser.role, id);
    return this.service.createGroup(id, data);
  }
}
