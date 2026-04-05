import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  @Get('chat/stats')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  getChatStats() { return this.service.getChatStats(); }

  @Get('chats')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  findAllChats(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAllChats({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      type,
      status,
    });
  }

  @Get('chats/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  findChat(@Param('id', ParseIntPipe) id: number) { return this.service.findChat(id); }

  @Post('chats')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  createChat(@Body() data: any, @CurrentUser() user: any) {
    return this.service.createChat({ ...data, createdBy: user.userId });
  }

  @Get('chats/:id/messages')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  getChatMessages(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getChatMessages(id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Post('chats/:id/messages')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.service.sendMessage(id, { ...data, senderId: user.userId });
  }

  @Delete('messages/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  deleteMessage(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteMessage(id);
  }

  @Patch('chats/:id/toggle')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  toggleChatActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleChatActive(id);
  }

  @Get('video/stats')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.read')
  getVideoStats() { return this.service.getVideoStats(); }

  @Get('video/sessions')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.read')
  findAllVideoSessions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.findAllVideoSessions({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      status,
      type,
      dateFrom,
      dateTo,
    });
  }

  @Get('video/sessions/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.read')
  findVideoSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.findVideoSession(id);
  }

  @Post('video/schedule')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  scheduleVideoSession(@Body() data: any, @CurrentUser() user: any) {
    return this.service.scheduleVideoSession({ ...data, hostId: data.hostId || user.userId });
  }

  @Patch('video/:id/start')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  startVideoSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.startVideoSession(id);
  }

  @Patch('video/:id/end')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  endVideoSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.endVideoSession(id);
  }

  @Patch('video/:id/cancel')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  cancelVideoSession(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancelVideoSession(id);
  }

  @Get('notifications')
  findAllNotifications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.findAllNotifications({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      userId: userId ? parseInt(userId) : undefined,
    });
  }

  @Post('notifications')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  createNotification(@Body() data: any) { return this.service.createNotification(data); }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id', ParseIntPipe) id: number) { return this.service.markNotificationRead(id); }

  @Get('announcements')
  findAllAnnouncements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('centerId') centerId?: string,
  ) {
    return this.service.findAllAnnouncements({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      centerId: centerId ? parseInt(centerId) : undefined,
    });
  }

  @Post('announcements')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  createAnnouncement(@Body() data: any) { return this.service.createAnnouncement(data); }

  @Patch('announcements/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  updateAnnouncement(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateAnnouncement(id, data); }

  @Delete('announcements/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.delete')
  removeAnnouncement(@Param('id', ParseIntPipe) id: number) { return this.service.removeAnnouncement(id); }
}
