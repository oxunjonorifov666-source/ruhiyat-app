import { Controller, Get, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.read')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.findAll({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      role,
    });
  }

  @Get(':id')
  @Permissions('users.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('users.write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    return this.usersService.update(id, data, currentUser.role);
  }

  @Delete(':id')
  @Permissions('users.delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    return this.usersService.remove(id, currentUser.userId);
  }

  @Get(':id/sessions')
  @Permissions('users.read')
  getSessions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getSessions(id);
  }
}
