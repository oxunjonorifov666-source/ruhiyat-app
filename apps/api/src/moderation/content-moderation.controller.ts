import { Controller, Get, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ContentModerationService } from './content-moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { QueryContentModerationDto, ModerationActionDto } from './dto/content-moderation.dto';

@Controller('content-moderation')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContentModerationController {
  constructor(private readonly service: ContentModerationService) {}

  @Get()
  @Permissions('content.moderate')
  findAll(@Query() query: QueryContentModerationDto) {
    return this.service.findAll({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      status: query.status,
      contentType: query.contentType,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('stats')
  @Permissions('content.moderate')
  getStats() {
    return this.service.getStats();
  }

  @Patch(':id/approve')
  @Permissions('content.moderate')
  approve(@Param('id', ParseIntPipe) id: number, @Body() data: ModerationActionDto, @CurrentUser() user: any) {
    return this.service.approve(id, user.userId, data.moderatorNote);
  }

  @Patch(':id/reject')
  @Permissions('content.moderate')
  reject(@Param('id', ParseIntPipe) id: number, @Body() data: ModerationActionDto, @CurrentUser() user: any) {
    return this.service.reject(id, user.userId, data.moderatorNote);
  }

  @Patch(':id/hide')
  @Permissions('content.moderate')
  hide(@Param('id', ParseIntPipe) id: number, @Body() data: ModerationActionDto, @CurrentUser() user: any) {
    return this.service.hide(id, user.userId, data.moderatorNote);
  }
}
