import { Controller, Get, Post, Patch, Delete, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import type { AuthUser } from '@ruhiyat/types';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UseInterceptors } from '@nestjs/common';
import { diskStorage } from 'multer';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  @Get('chat/stats')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  getChatStats(@CurrentUser() user: any) {
    return this.service.getChatStats(user.role);
  }

  @Get('chats')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  findAllChats(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAllChats({
      requesterId: user.id,
      requesterRole: user.role,
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
  findChat(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.findChat(id, user.id);
  }

  @Post('chats')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  createChat(@Body() data: any, @CurrentUser() user: any) {
    return this.service.createChat({ ...data, createdBy: user.id });
  }

  @Get('chats/participants/lookup')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  lookupChatParticipants(
    @Query('email') email?: string,
    @Query('q') q?: string,
  ) {
    return this.service.lookupUsersForChat({ email, q });
  }

  @Post('chats/:id/participants')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  addChatParticipants(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { emails?: string[]; userIds?: number[] },
    @CurrentUser() user: any,
  ) {
    return this.service.addParticipants(id, user.id, data);
  }

  @Post('chats/:id/attachments')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 10 * 1024 * 1024 },
    storage: diskStorage({
      destination: 'uploads/chat',
      filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
        const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || 'bin';
        const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        cb(null, safe);
      },
    }),
    fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
      const ok = [
        'image/jpeg','image/png','image/webp','application/pdf',
        'text/plain','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ].includes(file.mimetype);
      cb(null, ok);
    },
  }))
  async uploadChatAttachment(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    const url = await this.service.saveChatAttachment(user.id, id, file);
    return { url };
  }

  @Get('chats/:id/messages')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  getChatMessages(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getChatMessages(
      id,
      {
        page: page ? parseInt(page) : undefined,
        limit: limit ? parseInt(limit) : undefined,
      },
      { markReadForUserId: user.id, requesterId: user.id },
    );
  }

  @Post('chats/:id/messages')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
    @CurrentUser() user: any,
  ) {
    return this.service.sendMessage(id, { ...data, senderId: user.id });
  }

  @Delete('messages/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  deleteMessage(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.deleteMessage(id, user.id);
  }

  @Patch('chats/:id/toggle')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  toggleChatActive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.toggleChatActive(id, user.id);
  }

  @Patch('chats/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  updateChat(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; imageUrl?: string | null },
    @CurrentUser() user: any,
  ) {
    return this.service.updateChat(id, user.id, body);
  }

  @Delete('chats/:id')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  deleteChat(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.deleteChat(id, user.id);
  }

  @Delete('chats/:id/participants/:userId')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  removeChatParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: any,
  ) {
    return this.service.removeParticipant(id, user.id, userId);
  }

  @Post('chats/:id/mark-read')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.read')
  markChatRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.markChatRead(id, user.id);
  }

  @Post('chats/:id/avatar')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 3 * 1024 * 1024 },
    storage: diskStorage({
      destination: 'uploads/chat-avatars',
      filename: (req: any, file: any, cb: (error: Error | null, filename: string) => void) => {
        const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || 'bin';
        const safe = `av-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
        cb(null, safe);
      },
    }),
    fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
      const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
      cb(null, ok);
    },
  }))
  async uploadGroupAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.service.saveGroupAvatar(user.id, id, file);
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

  @Get('video/sessions/:id/join-token')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.read')
  getVideoJoinToken(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.service.getVideoJoinToken(id, { userId: user.id, role: user.role });
  }

  @Post('video/schedule')
  @UseGuards(PermissionsGuard)
  @Permissions('meetings.write')
  scheduleVideoSession(@Body() data: any, @CurrentUser() user: any) {
    return this.service.scheduleVideoSession({ ...data, hostId: data.hostId || user.id });
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
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
  ) {
    const isSuperadmin = user.role === 'SUPERADMIN';
    return this.service.findAllNotifications({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      userId: isSuperadmin ? (userId ? parseInt(userId) : undefined) : user.id,
    });
  }

  @Post('notifications')
  @UseGuards(PermissionsGuard)
  @Permissions('communication.write')
  createNotification(@Body() data: any) { return this.service.createNotification(data); }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.service.markNotificationRead(id, user.id);
  }

  @Get('announcements')
  findAllAnnouncements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('centerId') centerId?: string,
    @Query('published') published?: string,
  ) {
    return this.service.findAllAnnouncements({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
      centerId: centerId ? parseInt(centerId) : undefined,
      publishedOnly: published === 'true',
    });
  }

  @Get('announcements/:id')
  findOneAnnouncement(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.getAnnouncementForViewer(id, user);
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
