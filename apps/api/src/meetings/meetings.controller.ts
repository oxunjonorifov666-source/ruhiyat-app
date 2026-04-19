import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';
import { CreateMeetingDto, UpdateMeetingDto } from './dto';

/**
 * Marshrutlarda `TenantGuard` qo‘llanmaydi: u faqat `ADMINISTRATOR`+ markaz ID ni majburlaydi;
 * uchrashuvlarga ruxsati bo‘lgan psixolog / boshqa rollar `MeetingsService` ichida
 * markaz doirasida (`meetingInCenterScope`) tekshiriladi.
 */
@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Get()
  findAll(
    @CurrentUser() requester: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('centerId') centerId?: string,
  ) {
    return this.service.findAll(
      {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        search,
        status,
        centerId,
      },
      requester,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() requester: AuthUser) {
    return this.service.findOne(id, requester);
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  create(@Body() data: CreateMeetingDto, @CurrentUser() requester: AuthUser) {
    return this.service.create(data, requester);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateMeetingDto,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.update(id, data, requester);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.delete')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() requester: AuthUser) {
    return this.service.remove(id, requester);
  }

  @Post(':id/join')
  join(@Param('id', ParseIntPipe) id: number, @CurrentUser() requester: AuthUser) {
    return this.service.join(id, requester);
  }

  @Post(':id/leave')
  leave(@Param('id', ParseIntPipe) id: number, @CurrentUser() requester: AuthUser) {
    return this.service.leave(id, requester);
  }

  /**
   * Privileged: remove another participant from the meeting (same center scope as other write ops).
   * Self-service leave remains POST :id/leave (no userId in body).
   */
  @Post(':id/participants/:userId/remove')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  removeParticipant(
    @Param('id', ParseIntPipe) meetingId: number,
    @Param('userId', ParseIntPipe) targetUserId: number,
    @CurrentUser() requester: AuthUser,
  ) {
    return this.service.removeParticipant(meetingId, targetUserId, requester);
  }
}
