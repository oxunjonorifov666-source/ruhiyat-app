import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BlockUserDto } from './dto/block-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.read')
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      role: query.role,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('users.read')
  getStats() {
    return this.usersService.getStats();
  }

  @Get(':id')
  @Permissions('users.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions('users.manage')
  create(
    @Body() data: CreateUserDto,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    if (data.role === 'SUPERADMIN' && currentUser.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Faqat superadmin yangi superadmin yarata oladi');
    }
    return this.usersService.create(data);
  }

  @Patch(':id')
  @Permissions('users.write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    return this.usersService.update(id, data, currentUser.role);
  }

  @Patch(':id/block')
  @Permissions('users.manage')
  block(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: BlockUserDto,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    return this.usersService.block(id, currentUser.userId, data.reason);
  }

  @Patch(':id/unblock')
  @Permissions('users.manage')
  unblock(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.unblock(id);
  }

  @Delete(':id')
  @Permissions('users.manage')
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
