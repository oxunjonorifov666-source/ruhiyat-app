import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USER_SELECT = { id: true, email: true, firstName: true, lastName: true, role: true } as const;
const USER_SELECT_PHONE = { ...USER_SELECT, phone: true } as const;

@Injectable()
export class CommunicationService {
  constructor(private readonly prisma: PrismaService) {}

  async getChatStats() {
    const [totalChats, activeChats, totalMessages, todayMessages] = await Promise.all([
      this.prisma.chat.count(),
      this.prisma.chat.count({ where: { isActive: true } }),
      this.prisma.message.count(),
      this.prisma.message.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
    ]);
    return { totalChats, activeChats, totalMessages, todayMessages };
  }

  async findAllChats(query: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.status === 'active') where.isActive = true;
    if (query.status === 'inactive') where.isActive = false;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        {
          participants: {
            some: {
              user: {
                OR: [
                  { firstName: { contains: query.search, mode: 'insensitive' } },
                  { lastName: { contains: query.search, mode: 'insensitive' } },
                  { email: { contains: query.search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    const [chats, total] = await Promise.all([
      this.prisma.chat.findMany({
        where,
        include: {
          participants: {
            include: {
              user: { select: USER_SELECT },
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' as const },
            take: 1,
            include: {
              sender: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chat.count({ where }),
    ]);

    const data = chats.map((chat) => {
      const { messages, _count, ...rest } = chat;
      return {
        ...rest,
        lastMessage: messages[0] || null,
        messageCount: _count.messages,
      };
    });

    return { data, total, page, limit };
  }

  async findChat(id: number) {
    const chat = await this.prisma.chat.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: { select: USER_SELECT_PHONE },
          },
        },
        _count: { select: { messages: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    return chat;
  }

  async createChat(data: { type?: string; title?: string; participantIds: number[]; createdBy?: number }) {
    return this.prisma.chat.create({
      data: {
        type: (data.type as any) || 'DIRECT',
        title: data.title,
        createdBy: data.createdBy,
        participants: {
          create: data.participantIds.map((userId) => ({ userId })),
        },
      },
      include: {
        participants: {
          include: {
            user: { select: USER_SELECT },
          },
        },
      },
    });
  }

  async getChatMessages(chatId: number, query: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { chatId, isDeleted: false },
        include: {
          sender: { select: USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.message.count({ where: { chatId, isDeleted: false } }),
    ]);

    return { data: data.reverse(), total, page, limit };
  }

  async sendMessage(chatId: number, data: { senderId: number; content: string; type?: string; attachmentUrl?: string }) {
    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: data.senderId,
        content: data.content,
        type: data.type || 'text',
        attachmentUrl: data.attachmentUrl,
      },
      include: {
        sender: { select: USER_SELECT },
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async deleteMessage(messageId: number) {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { isDeleted: true },
    });
  }

  async toggleChatActive(chatId: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { isActive: !chat.isActive },
    });
  }

  async getVideoStats() {
    const [totalSessions, scheduledSessions, activeSessions, completedSessions] = await Promise.all([
      this.prisma.meeting.count(),
      this.prisma.meeting.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.meeting.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.meeting.count({ where: { status: 'COMPLETED' } }),
    ]);
    return { totalSessions, scheduledSessions, activeSessions, completedSessions };
  }

  async findAllVideoSessions(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { host: { OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ]}},
      ];
    }
    if (query.dateFrom || query.dateTo) {
      where.scheduledAt = {};
      if (query.dateFrom) where.scheduledAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.scheduledAt.lte = new Date(query.dateTo + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          host: { select: USER_SELECT },
          _count: { select: { participants: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findVideoSession(id: number) {
    const session = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        host: { select: USER_SELECT_PHONE },
        participants: {
          include: {
            user: { select: USER_SELECT },
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Video seans topilmadi');
    return session;
  }

  async scheduleVideoSession(data: {
    title: string;
    description?: string;
    hostId: number;
    scheduledAt: string;
    duration: number;
    type?: string;
    participantIds?: number[];
  }) {
    const meetingUrl = `https://meet.ruhiyat.uz/${Date.now()}-${Math.random().toString(36).substring(7)}`;

    return this.prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        hostId: data.hostId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        type: (data.type as any) || 'CONSULTATION',
        meetingUrl,
        participants: data.participantIds?.length
          ? { create: data.participantIds.map((userId) => ({ userId })) }
          : undefined,
      },
      include: {
        host: { select: USER_SELECT },
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });
  }

  async startVideoSession(id: number) {
    const session = await this.findVideoSession(id);
    if (session.status !== 'SCHEDULED') {
      throw new ForbiddenException('Faqat rejalashtirilgan seansni boshlash mumkin');
    }
    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async endVideoSession(id: number) {
    const session = await this.findVideoSession(id);
    if (session.status !== 'IN_PROGRESS') {
      throw new ForbiddenException('Faqat faol seansni tugatish mumkin');
    }
    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async cancelVideoSession(id: number) {
    return this.prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
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

  async markNotificationRead(id: number, userId?: number) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException("Bildirishnoma topilmadi");
    if (userId && notification.userId !== userId) {
      throw new ForbiddenException("Ruxsat yo'q");
    }
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
