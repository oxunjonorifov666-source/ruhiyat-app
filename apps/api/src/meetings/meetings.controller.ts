import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

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
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  create(@Body() data: any) { return this.service.create(data); }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.update(id, data); }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.delete')
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Post(':id/join')
  join(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.join(id, data); }

  @Post(':id/leave')
  leave(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.leave(id, data); }
}
