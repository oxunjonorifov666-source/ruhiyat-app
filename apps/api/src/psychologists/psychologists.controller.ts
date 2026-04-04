import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards, ForbiddenException } from '@nestjs/common';
import { PsychologistsService } from './psychologists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryPsychologistsDto } from './dto/query-psychologists.dto';
import { CreatePsychologistDto } from './dto/create-psychologist.dto';
import { UpdatePsychologistDto } from './dto/update-psychologist.dto';
import { RejectPsychologistDto } from './dto/verify-psychologist.dto';

@Controller('psychologists')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PsychologistsController {
  constructor(private readonly service: PsychologistsService) {}

  @Get()
  @Permissions('psychologists.read')
  findAll(@Query() query: QueryPsychologistsDto) {
    return this.service.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      specialization: query.specialization,
      status: query.status,
      minRating: query.minRating ? parseFloat(query.minRating) : undefined,
      minExperience: query.minExperience ? parseInt(query.minExperience) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('psychologists.read')
  getStats() {
    return this.service.getStats();
  }

  @Get(':id')
  @Permissions('psychologists.read')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Permissions('psychologists.write')
  create(@Body() data: CreatePsychologistDto) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Permissions('psychologists.write')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: UpdatePsychologistDto) {
    return this.service.update(id, data);
  }

  @Patch(':id/verify')
  @Permissions('psychologists.manage')
  verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Faqat superadmin psixologni tasdiqlashi mumkin');
    }
    return this.service.verify(id);
  }

  @Patch(':id/reject')
  @Permissions('psychologists.manage')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RejectPsychologistDto,
    @CurrentUser() currentUser: { userId: number; role: string },
  ) {
    if (currentUser.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Faqat superadmin psixologni rad etishi mumkin');
    }
    return this.service.reject(id, data.reason);
  }

  @Delete(':id')
  @Permissions('psychologists.manage')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
