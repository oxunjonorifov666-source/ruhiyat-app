import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('system.settings')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() { return this.rolesService.findAll(); }

  @Post()
  create(@Body() data: any) { return this.rolesService.create(data); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.rolesService.findOne(id); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.rolesService.update(id, data); }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) { return this.rolesService.remove(id); }

  @Get(':id/permissions')
  getPermissions(@Param('id', ParseIntPipe) id: number) { return this.rolesService.getPermissions(id); }

  @Post(':id/permissions')
  addPermission(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.rolesService.addPermission(id, data); }
}
