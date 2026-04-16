import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('system.settings')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('centers.read')
  findAll(@CurrentUser() user: AuthUser) { 
    return this.rolesService.findAll(user); 
  }

  @Post()
  @Permissions('centers.write')
  create(@Body() data: any, @CurrentUser() user: AuthUser) { 
    return this.rolesService.create(data, user); 
  }

  @Get(':id')
  @Permissions('centers.read')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) { 
    return this.rolesService.findOne(id, user); 
  }

  @Patch(':id')
  @Permissions('centers.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any, @CurrentUser() user: AuthUser) { 
    return this.rolesService.update(id, data, user); 
  }

  @Delete(':id')
  @Permissions('centers.delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) { 
    return this.rolesService.remove(id, user); 
  }

  @Get(':id/permissions')
  @Permissions('centers.read')
  getPermissions(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) { 
    return this.rolesService.getPermissions(id, user); 
  }

  @Post(':id/permissions')
  @Permissions('centers.write')
  addPermission(@Param('id', ParseIntPipe) id: number, @Body() data: any, @CurrentUser() user: AuthUser) { 
    return this.rolesService.addPermission(id, data, user); 
  }

  @Delete(':id/permissions/:permissionId')
  @Permissions('centers.write')
  removePermission(
    @Param('id', ParseIntPipe) id: number, 
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @CurrentUser() user: AuthUser
  ) { 
    return this.rolesService.removePermission(id, permissionId, user); 
  }
}
