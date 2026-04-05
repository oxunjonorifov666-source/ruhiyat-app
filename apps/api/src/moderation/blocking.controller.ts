import { Controller, Get, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BlockingService } from './blocking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BlockDto, QueryBlocksDto, QueryBlockHistoryDto } from './dto/block.dto';

@Controller('blocks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BlockingController {
  constructor(private readonly service: BlockingService) {}

  @Get()
  @Permissions('blocks.manage')
  findBlocked(@Query() query: QueryBlocksDto) {
    return this.service.findBlocked({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      search: query.search,
      targetType: query.targetType,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  @Get('history')
  @Permissions('blocks.manage')
  getHistory(@Query() query: QueryBlockHistoryDto) {
    return this.service.getHistory({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      targetType: query.targetType,
      action: query.action,
    });
  }

  @Patch('users/:id/block')
  @Permissions('blocks.manage')
  blockUser(@Param('id', ParseIntPipe) id: number, @Body() data: BlockDto, @CurrentUser() user: any) {
    return this.service.blockUser(id, user.userId, data.reason);
  }

  @Patch('users/:id/unblock')
  @Permissions('blocks.manage')
  unblockUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.unblockUser(id, user.userId);
  }

  @Patch('psychologists/:id/block')
  @Permissions('blocks.manage')
  blockPsychologist(@Param('id', ParseIntPipe) id: number, @Body() data: BlockDto, @CurrentUser() user: any) {
    return this.service.blockPsychologist(id, user.userId, data.reason);
  }

  @Patch('psychologists/:id/unblock')
  @Permissions('blocks.manage')
  unblockPsychologist(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.unblockPsychologist(id, user.userId);
  }
}
