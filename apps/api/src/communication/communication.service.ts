import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllChats() { return this.prisma.chat.findMany({ include: { participants: true } }); }
  async createChat(data: any) { return this.prisma.chat.create({ data }); }
  async findChat(id: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id }, include: { participants: true } });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    return chat;
  }
  async getChatMessages(id: number) {
    return this.prisma.message.findMany({
      where: { chatId: id },
      include: { sender: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }
  async sendMessage(chatId: number, data: any) {
    return this.prisma.message.create({ data: { chatId, ...data } });
  }

  async findAllNotifications(query: { page?: number; limit?: number; userId?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createNotification(data: any) {
    return this.prisma.notification.create({ data });
  }

  async markNotificationRead(id: number) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async findAllAnnouncements(query: { page?: number; limit?: number; search?: string; centerId?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.centerId) where.centerId = query.centerId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.announcement.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createAnnouncement(data: any) { return this.prisma.announcement.create({ data }); }

  async updateAnnouncement(id: number, data: any) {
    return this.prisma.announcement.update({ where: { id }, data });
  }

  async removeAnnouncement(id: number) {
    await this.prisma.announcement.delete({ where: { id } });
    return { message: "E'lon o'chirildi" };
  }
}
