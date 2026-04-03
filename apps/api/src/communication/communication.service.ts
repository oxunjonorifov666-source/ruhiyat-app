import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllChats() { return this.prisma.chat.findMany({ include: { participants: true } }); }

  async createChat(data: any) { return this.prisma.chat.create({ data }); }

  async findChat(id: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id }, include: { participants: true } });
    if (!chat) throw new NotFoundException('Chat not found');
    return chat;
  }

  async getChatMessages(id: number) {
    return this.prisma.message.findMany({ where: { chatId: id }, orderBy: { createdAt: 'asc' } });
  }

  async sendMessage(chatId: number, data: any) {
    return this.prisma.message.create({ data: { chatId, ...data } });
  }

  async findAllNotifications() { return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' } }); }

  async markNotificationRead(id: number) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async findAllAnnouncements() { return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } }); }

  async createAnnouncement(data: any) { return this.prisma.announcement.create({ data }); }

  async updateAnnouncement(id: number, data: any) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async removeAnnouncement(id: number) {
    await this.prisma.announcement.delete({ where: { id } });
    return { message: 'Announcement deleted' };
  }
}
