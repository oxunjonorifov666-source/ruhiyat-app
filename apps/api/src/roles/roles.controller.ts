import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StepUpGuard } from '../auth/guards/step-up.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { CreateRoleDto, UpdateRoleDto, AddPermissionDto } from './dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPERADMIN)
@Permissions('system.settings')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) { 
    return this.rolesService.findAll(user); 
  }

  @Post()
  @UseGuards(StepUpGuard)
  create(@Body() data: CreateRoleDto, @CurrentUser() user: AuthUser) { 
    return this.rolesService.create(data, user); 
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) { 
    return this.rolesService.findOne(id, user); 
  }

  @Patch(':id')
  @UseGuards(StepUpGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateRoleDto, @CurrentUser() user: AuthUser) { 
    return this.rolesService.update(id, data, user); 
  }

  @Delete(':id')
  @UseGuards(StepUpGuard)
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) { 
    return this.rolesService.remove(id, user); 
  }

  @Get(':id/permissions')
  getPermissions(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) { 
    return this.rolesService.getPermissions(id, user); 
  }

  @Post(':id/permissions')
  @UseGuards(StepUpGuard)
  addPermission(@Param('id', ParseIntPipe) id: number, @Body() data: AddPermissionDto, @CurrentUser() user: AuthUser) { 
    return this.rolesService.addPermission(id, data, user); 
  }

  @Delete(':id/permissions/:permissionId')
  @UseGuards(StepUpGuard)
  removePermission(
    @Param('id', ParseIntPipe) id: number, 
    @Param('permissionId', ParseIntPipe) permissionId: number,
    @CurrentUser() user: AuthUser
  ) { 
    return this.rolesService.removePermission(id, permissionId, user); 
  }
}
