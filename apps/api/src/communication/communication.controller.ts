import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  @Get('chats')
  findAllChats() { return this.service.findAllChats(); }

  @Post('chats')
  createChat(@Body() data: any) { return this.service.createChat(data); }

  @Get('chats/:id')
  findChat(@Param('id', ParseIntPipe) id: number) { return this.service.findChat(id); }

  @Get('chats/:id/messages')
  getChatMessages(@Param('id', ParseIntPipe) id: number) { return this.service.getChatMessages(id); }

  @Post('chats/:id/messages')
  sendMessage(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.sendMessage(id, data); }

  @Get('notifications')
  findAllNotifications() { return this.service.findAllNotifications(); }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id', ParseIntPipe) id: number) { return this.service.markNotificationRead(id); }

  @Get('announcements')
  findAllAnnouncements() { return this.service.findAllAnnouncements(); }

  @Post('announcements')
  createAnnouncement(@Body() data: any) { return this.service.createAnnouncement(data); }

  @Patch('announcements/:id')
  updateAnnouncement(@Param('id', ParseIntPipe) id: number, @Body() data: any) { return this.service.updateAnnouncement(id, data); }

  @Delete('announcements/:id')
  removeAnnouncement(@Param('id', ParseIntPipe) id: number) { return this.service.removeAnnouncement(id); }
}
