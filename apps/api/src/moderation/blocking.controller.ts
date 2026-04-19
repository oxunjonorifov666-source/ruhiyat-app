import { Controller, Get, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { UserRole, type AuthUser } from '@ruhiyat/types';
import { BlockingService } from './blocking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StepUpGuard } from '../auth/guards/step-up.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BlockDto, QueryBlocksDto, QueryBlockHistoryDto } from './dto/block.dto';

/**
 * Platform-wide bloklash (global User / Psychologist) — faqat SUPERADMIN.
 * Markaz administratorlari to‘g‘ridan-to‘g‘ri API orqali boshqa markaz yoki global foydalanuvchilarni bloklay olmasligi kerak.
 */
@Controller('blocks')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.SUPERADMIN)
export class BlockingController {
  constructor(private readonly service: BlockingService) {}

  @Get()
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
  getHistory(@Query() query: QueryBlockHistoryDto) {
    return this.service.getHistory({
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      targetType: query.targetType,
      action: query.action,
    });
  }

  @Patch('users/:id/block')
  @UseGuards(StepUpGuard)
  blockUser(@Param('id', ParseIntPipe) id: number, @Body() data: BlockDto, @CurrentUser() user: AuthUser) {
    return this.service.blockUser(id, user, data.reason);
  }

  @Patch('users/:id/unblock')
  unblockUser(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.unblockUser(id, user);
  }

  @Patch('psychologists/:id/block')
  @UseGuards(StepUpGuard)
  blockPsychologist(@Param('id', ParseIntPipe) id: number, @Body() data: BlockDto, @CurrentUser() user: AuthUser) {
    return this.service.blockPsychologist(id, user, data.reason);
  }

  @Patch('psychologists/:id/unblock')
  @UseGuards(StepUpGuard)
  unblockPsychologist(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.unblockPsychologist(id, user);
  }
}
