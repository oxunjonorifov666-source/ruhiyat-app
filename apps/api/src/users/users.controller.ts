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
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users.read')
  findAll(@Query() query: QueryUsersDto, @CurrentUser() user: AuthUser) {
    return this.usersService.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      role: query.role,
      status: query.status,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    }, user);
  }

  @Get('stats')
  @Permissions('users.read')
  getStats(@CurrentUser() user: AuthUser) {
    return this.usersService.getStats(user);
  }

  @Get(':id')
  @Permissions('users.read')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.usersService.findOne(id, user);
  }

  @Post()
  @Permissions('users.manage')
  create(
    @Body() data: CreateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    if (data.role === UserRole.SUPERADMIN && user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat superadmin yangi superadmin yarata oladi');
    }
    return this.usersService.create(data, user);
  }

  @Patch(':id')
  @Permissions('users.write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.update(id, data, user);
  }

  @Patch(':id/block')
  @Permissions('users.manage')
  block(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: BlockUserDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.block(id, data.reason, user);
  }

  @Patch(':id/unblock')
  @Permissions('users.manage')
  unblock(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.usersService.unblock(id, user);
  }

  @Delete(':id')
  @Permissions('users.manage')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ) {
    return this.usersService.remove(id, user);
  }

  @Get(':id/sessions')
  @Permissions('users.read')
  getSessions(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.usersService.getSessions(id, user);
  }
}
