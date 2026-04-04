import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, ForbiddenException } from '@nestjs/common';
import { AdministratorsService } from './administrators.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryAdministratorsDto } from './dto/query-administrators.dto';
import { CreateAdministratorDto } from './dto/create-administrator.dto';
import { UpdateAdministratorDto } from './dto/update-administrator.dto';

@Controller('administrators')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdministratorsController {
  constructor(private readonly service: AdministratorsService) {}

  @Get()
  @Permissions('administrators.read')
  findAll(@Query() query: QueryAdministratorsDto) {
    return this.service.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      status: query.status,
      plan: query.plan,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('administrators.read')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @Permissions('administrators.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('administrators.write')
  create(@Body() data: CreateAdministratorDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('administrators.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateAdministratorDto) {
    return this.service.update(id, data);
  }

  @Patch(':id/activate')
  @Permissions('administrators.manage')
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.service.activate(id);
  }

  @Patch(':id/deactivate')
  @Permissions('administrators.manage')
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.service.deactivate(id);
  }

  @Delete(':id')
  @Permissions('administrators.manage')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new ForbiddenException("Faqat superadmin administratorni o'chirishi mumkin");
    }
    return this.service.remove(id);
  }
}
