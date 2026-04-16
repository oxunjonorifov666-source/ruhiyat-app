import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ChatGateway } from './chat.gateway';
import { PushNotificationService } from '../push/push-notification.service';
// path import intentionally omitted (no path ops needed here)

const USER_SELECT = { id: true, email: true, firstName: true, lastName: true, role: true } as const;
const USER_SELECT_PHONE = { ...USER_SELECT, phone: true } as const;
const ADMIN_ROLES = ['SUPERADMIN', 'ADMINISTRATOR'] as const;
const VIDEO_ADMIN_ROLES = ['SUPERADMIN', 'ADMINISTRATOR'] as const;

@Injectable()
export class CommunicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly pushNotification: PushNotificationService,
  ) {}

  /** Mobil ro‘yxat/karta bilan bir xil shakl (lastMessage, messageCount) */
  private async formatChatForMobile(chatId: number) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: { include: { user: { select: USER_SELECT_PHONE } } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        },
        _count: { select: { messages: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    const { messages, _count, ...rest } = chat;
    return {
      ...rest,
      lastMessage: messages[0] || null,
      messageCount: _count.messages,
    };
  }

  /** Email/telefon bo‘yicha boshqa mobil foydalanuvchilarni qidirish (direct chat uchun) */
  async searchChatContacts(requesterId: number, q: string) {
    const query = q.trim();
    if (query.length < 2) {
      throw new BadRequestException('Kamida 2 belgi kiriting');
    }
    return this.prisma.user.findMany({
      where: {
        id: { not: requesterId },
        role: 'MOBILE_USER',
        isActive: true,
        isBlocked: false,
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
      take: 25,
      orderBy: { id: 'asc' },
    });
  }

  async createDirectChatByEmail(requesterId: number, email: string) {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      throw new BadRequestException('To‘g‘ri email manzilini kiriting');
    }
    const other = await this.prisma.user.findFirst({
      where: {
        email: { equals: e, mode: 'insensitive' },
        role: 'MOBILE_USER',
        isActive: true,
        isBlocked: false,
        NOT: { id: requesterId },
      },
      select: { id: true },
    });
    if (!other) {
      throw new NotFoundException('Bu email bilan mobil foydalanuvchi topilmadi');
    }
    return this.createOrGetDirectChat(requesterId, other.id);
  }

  private async ensureParticipantOrAdmin(userId: number, chatId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role && ADMIN_ROLES.includes(user.role as any)) return;
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException("Siz ushbu chat ishtirokchisi emassiz");
    }
  }

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

  async findMyChats(
    userId: number,
    query: { page?: number; limit?: number; search?: string } = {},
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      participants: { some: { userId } },
      isActive: true,
    };

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
                  { phone: { contains: query.search, mode: 'insensitive' } },
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
          participants: { include: { user: { select: USER_SELECT_PHONE } } },
          messages: {
            orderBy: { createdAt: 'desc' as const },
            take: 1,
            include: { sender: { select: { id: true, firstName: true, lastName: true } } },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chat.count({ where }),
    ]);

    const data = chats.map((chat: any) => {
      const { messages, _count, ...rest } = chat;
      return {
        ...rest,
        lastMessage: messages[0] || null,
        messageCount: _count.messages,
      };
    });

    return { data, total, page, limit };
  }

  async getMyChatMessages(chatUserId: number, chatId: number, query: { page?: number; limit?: number } = {}) {
    await this.ensureParticipantOrAdmin(chatUserId, chatId);
    return this.getChatMessages(chatId, query);
  }

  async sendMyMessage(chatUserId: number, chatId: number, data: { content?: string; type?: string; attachmentUrl?: string }) {
    await this.ensureParticipantOrAdmin(chatUserId, chatId);
    const message = await this.sendMessage(chatId, {
      senderId: chatUserId,
      content: data.content || null,
      type: data.type || (data.attachmentUrl ? 'attachment' : 'text'),
      attachmentUrl: data.attachmentUrl,
    });

    // Also broadcast to websocket room for real-time updates
    this.chatGateway.server?.to(`chat:${chatId}`).emit('newMessage', message);
    return message;
  }

  async saveChatAttachment(chatUserId: number, chatId: number, file: Express.Multer.File) {
    await this.ensureParticipantOrAdmin(chatUserId, chatId);

    // FileInterceptor already enforced size + mimetype; keep extra hardening here.
    if (!file.filename || file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
      throw new ForbiddenException('Noto‘g‘ri fayl nomi');
    }
    const url = `/uploads/chat/${file.filename}`;
    return url;
  }

  /** Mobil foydalanuvchi ↔ birinchi faol superadmin qo‘llab-quvvatlash chati */
  async ensureSupportChatForMobileUser(userId: number) {
    const admins = await this.prisma.user.findMany({
      where: { role: 'SUPERADMIN', isActive: true, isBlocked: false },
      orderBy: { id: 'asc' },
      take: 1,
      select: { id: true },
    });
    if (!admins.length) {
      throw new BadRequestException('Superadmin topilmadi — qo‘llab-quvvatlash chati yaratilmadi');
    }
    const adminId = admins[0].id;

    const candidates = await this.prisma.chat.findMany({
      where: {
        type: 'SUPPORT',
        isActive: true,
        participants: { some: { userId } },
      },
      include: { participants: true },
    });
    const existing = candidates.find(
      (c) =>
        c.participants.some((p) => p.userId === userId) &&
        c.participants.some((p) => p.userId === adminId) &&
        c.participants.length === 2,
    );
    if (existing) {
      return this.prisma.chat.findUnique({
        where: { id: existing.id },
        include: { participants: { include: { user: { select: USER_SELECT_PHONE } } } },
      });
    }

    return this.prisma.chat.create({
      data: {
        type: 'SUPPORT' as any,
        title: 'Ruhiyat qo‘llab-quvvatlash',
        createdBy: userId,
        participants: {
          create: [{ userId }, { userId: adminId }],
        },
      },
      include: { participants: { include: { user: { select: USER_SELECT_PHONE } } } },
    });
  }

  async createOrGetDirectChat(userId: number, otherUserId: number) {
    if (userId === otherUserId) {
      throw new ForbiddenException("O'zingiz bilan direct chat yaratib bo'lmaydi");
    }

    const existing = await this.prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        isActive: true,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      select: { id: true },
    });
    if (existing) {
      return this.formatChatForMobile(existing.id);
    }

    const created = await this.prisma.chat.create({
      data: {
        type: 'DIRECT' as any,
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
        createdBy: userId,
      },
      select: { id: true },
    });
    return this.formatChatForMobile(created.id);
  }

  async createGroupChat(userId: number, data: { title: string; participantIds: number[] }) {
    const participantIds = Array.from(new Set([userId, ...(data.participantIds || [])]));
    if (!data.title?.trim()) throw new ForbiddenException('Guruh nomi kiritilmagan');
    if (participantIds.length < 2) throw new ForbiddenException('Guruh uchun kamida 2 ishtirokchi kerak');

    return this.prisma.chat.create({
      data: {
        type: 'GROUP' as any,
        title: data.title.trim(),
        createdBy: userId,
        participants: { create: participantIds.map((id) => ({ userId: id })) },
      },
      include: { participants: { include: { user: { select: USER_SELECT } } } },
    });
  }

  async findAllChats(query: {
    requesterId?: number;
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

    const unreadByChatId: Record<number, number> = {};
    if (query.requesterId && chats.length > 0) {
      const uid = query.requesterId;
      const counts = await Promise.all(
        chats.map(async (chat: any) => {
          const myPart = chat.participants?.find((p: any) => p.userId === uid);
          const lastRead = myPart?.lastReadAt ? new Date(myPart.lastReadAt) : new Date(0);
          const cnt = await this.prisma.message.count({
            where: {
              chatId: chat.id,
              isDeleted: false,
              senderId: { not: uid },
              createdAt: { gt: lastRead },
            },
          });
          return [chat.id, cnt] as const;
        }),
      );
      for (const [id, cnt] of counts) unreadByChatId[id] = cnt;
    }

    const data = chats.map((chat: any) => {
      const { messages, _count, ...rest } = chat;
      return {
        ...rest,
        lastMessage: messages[0] || null,
        messageCount: _count.messages,
        unreadCount: unreadByChatId[chat.id] || 0,
      };
    });

    return { data, total, page, limit };
  }

  async lookupUsersForChat(query: { email?: string; q?: string }) {
    const email = query.email?.trim();
    const q = query.q?.trim();
    if (!email && !q) return { data: [] };

    const where: any = { isActive: true };
    if (email) {
      where.email = { equals: email, mode: 'insensitive' };
    } else if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      take: 10,
      select: USER_SELECT_PHONE,
      orderBy: { createdAt: 'desc' },
    });
    return { data: users };
  }

  async addParticipants(chatId: number, requesterId: number, data: { emails?: string[]; userIds?: number[] }) {
    // Must be participant or admin to manage members
    await this.ensureParticipantOrAdmin(requesterId, chatId);

    const chat = await this.prisma.chat.findUnique({ where: { id: chatId }, select: { id: true, type: true, isActive: true } });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    if (chat.type !== 'GROUP') throw new ForbiddenException('Faqat guruh chatiga ishtirokchi qo‘shish mumkin');

    const userIdsFromBody = (data.userIds || []).filter((x) => Number.isFinite(x as any)).map((x) => Number(x));
    const emails = (data.emails || []).map((e) => (e || '').trim()).filter(Boolean);

    const usersFromEmails = emails.length
      ? await this.prisma.user.findMany({ where: { email: { in: emails, mode: 'insensitive' } }, select: { id: true } })
      : [];

    const candidateIds = Array.from(new Set([requesterId, ...userIdsFromBody, ...usersFromEmails.map((u: any) => u.id)]));
    if (candidateIds.length === 0) return { added: 0 };

    const existing = await this.prisma.chatParticipant.findMany({
      where: { chatId, userId: { in: candidateIds } },
      select: { userId: true },
    });
    const existingSet = new Set(existing.map((e: any) => e.userId));
    const toAdd = candidateIds.filter((id) => !existingSet.has(id));
    if (toAdd.length === 0) return { added: 0 };

    await this.prisma.chatParticipant.createMany({
      data: toAdd.map((userId) => ({ chatId, userId })),
      skipDuplicates: true,
    });

    // Join sockets for newly added online users
    toAdd.forEach((uid) => this.chatGateway.emitToUser(uid, 'addedToChat', { chatId }));

    return { added: toAdd.length };
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

  async createChat(data: {
    type?: string;
    title?: string;
    imageUrl?: string | null;
    participantIds: number[];
    createdBy?: number;
  }) {
    const createdBy = data.createdBy ? Number(data.createdBy) : undefined;
    const requested = (data.participantIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id));
    const participantIds = createdBy ? Array.from(new Set([createdBy, ...requested])) : Array.from(new Set(requested));

    if (participantIds.length < 1) {
      throw new ForbiddenException('Ishtirokchilar roʻyxati bo‘sh');
    }
    return this.prisma.chat.create({
      data: {
        type: (data.type as any) || 'DIRECT',
        title: data.title,
        imageUrl: data.imageUrl ?? undefined,
        createdBy,
        participants: {
          create: participantIds.map((userId) => ({ userId })),
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

  async getChatMessages(
    chatId: number,
    query: { page?: number; limit?: number } = {},
    opts?: { markReadForUserId?: number },
  ) {
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

    if (opts?.markReadForUserId) {
      await this.markChatRead(chatId, opts.markReadForUserId).catch(() => undefined);
    }

    return { data: data.reverse(), total, page, limit };
  }

  async markChatRead(chatId: number, userId: number) {
    await this.ensureParticipantOrAdmin(userId, chatId);
    const existing = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
    });
    if (!existing) return;
    await this.prisma.chatParticipant.update({
      where: { chatId_userId: { chatId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  private async ensureCanManageGroupChat(
    requesterId: number,
    chat: { type: string; createdBy: number | null },
  ) {
    const u = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });
    if (u?.role === 'SUPERADMIN' || u?.role === 'ADMINISTRATOR') return;
    if (chat.type !== 'GROUP') throw new ForbiddenException('Faqat guruh chatlari uchun');
    if (!chat.createdBy || chat.createdBy !== requesterId) {
      throw new ForbiddenException('Faqat guruh yaratuvchisi yoki administrator');
    }
  }

  async updateChat(
    chatId: number,
    requesterId: number,
    data: { title?: string; imageUrl?: string | null },
  ) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    if (chat.type === 'GROUP') {
      await this.ensureCanManageGroupChat(requesterId, chat);
    } else {
      const u = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { role: true },
      });
      if (u?.role !== 'SUPERADMIN' && u?.role !== 'ADMINISTRATOR') {
        throw new ForbiddenException("Direct chatni faqat administrator o'zgartira oladi");
      }
    }
    const next: { title?: string | null; imageUrl?: string | null } = {};
    if (data.title !== undefined) next.title = data.title?.trim() || null;
    if (data.imageUrl !== undefined) next.imageUrl = data.imageUrl;
    return this.prisma.chat.update({
      where: { id: chatId },
      data: next,
      include: {
        participants: { include: { user: { select: USER_SELECT_PHONE } } },
        _count: { select: { messages: true } },
      },
    });
  }

  async deleteChat(chatId: number, requesterId: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    const u = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });
    const isAdmin = u?.role === 'SUPERADMIN' || u?.role === 'ADMINISTRATOR';
    if (isAdmin) {
      await this.prisma.chat.delete({ where: { id: chatId } });
      return { ok: true };
    }
    if (chat.type === 'GROUP' && chat.createdBy === requesterId) {
      await this.prisma.chat.delete({ where: { id: chatId } });
      return { ok: true };
    }
    throw new ForbiddenException("Chatni o'chirishga ruxsat yo'q");
  }

  async removeParticipant(chatId: number, requesterId: number, targetUserId: number) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new NotFoundException('Chat topilmadi');
    if (chat.type !== 'GROUP') throw new ForbiddenException('Faqat guruhdan chiqarish mumkin');

    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true },
    });
    const isAdmin = requester?.role === 'SUPERADMIN' || requester?.role === 'ADMINISTRATOR';

    if (targetUserId === requesterId) {
      const cnt = await this.prisma.chatParticipant.count({ where: { chatId } });
      if (cnt <= 1) throw new BadRequestException("Oxirgi ishtirokchini guruhdan olib bo'lmaydi");
      await this.prisma.chatParticipant.delete({
        where: { chatId_userId: { chatId, userId: targetUserId } },
      });
      return { ok: true };
    }

    if (targetUserId === chat.createdBy && !isAdmin) {
      throw new ForbiddenException("Guruh yaratuvchisini faqat superadmin olib tashlashi mumkin");
    }

    await this.ensureCanManageGroupChat(requesterId, chat);

    await this.prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });
    this.chatGateway.emitToUser(targetUserId, 'removedFromChat', { chatId });
    return { ok: true };
  }

  async saveGroupAvatar(requesterId: number, chatId: number, file: Express.Multer.File) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, createdBy: true },
    });
    if (!chat || chat.type !== 'GROUP') throw new ForbiddenException('Faqat guruh rasmi');
    await this.ensureCanManageGroupChat(requesterId, chat);

    if (!file?.filename || file.filename.includes('..') || file.filename.includes('/') || file.filename.includes('\\')) {
      throw new ForbiddenException('Noto‘g‘ri fayl nomi');
    }
    const url = `/uploads/chat-avatars/${file.filename}`;
    return this.prisma.chat.update({
      where: { id: chatId },
      data: { imageUrl: url },
      include: { participants: { include: { user: { select: USER_SELECT } } } },
    });
  }

  async sendMessage(chatId: number, data: { senderId: number; content: string | null; type?: string; attachmentUrl?: string }) {
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

    void this.pushNotification.notifyAfterChatMessage({ ...message, ...data }).catch(() => undefined);

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
    if (query.status) {
      const statuses = String(query.status)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
    }
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

  /** Mobil foydalanuvchi: faqat o‘z ishtiroki yoki host bo‘lgan video seanslar */
  async findVideoSessionsForMobileUser(
    userId: number,
    query: { page?: number; limit?: number; status?: string } = {},
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ hostId: userId }, { participants: { some: { userId } } }, { openBroadcast: true }],
    };
    if (query.status) {
      const statuses = String(query.status)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      where.status = statuses.length > 1 ? { in: statuses } : statuses[0];
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
    const domain = (process.env.JITSI_DOMAIN || 'meet.jit.si').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    const roomId = `ruhiyat-${Date.now()}-${randomBytes(6).toString('hex')}`;
    const meetingUrl = `https://${domain}/${roomId}`;

    const uniqueParticipantIds = Array.from(
      new Set([data.hostId, ...(data.participantIds || [])].map((x) => Number(x)).filter((x) => Number.isFinite(x)))
    );
    const explicitGuests = (data.participantIds || []).map((x) => Number(x)).filter((x) => Number.isFinite(x) && x !== data.hostId);
    const openBroadcast = explicitGuests.length === 0;

    return this.prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        hostId: data.hostId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration,
        type: (data.type as any) || 'CONSULTATION',
        meetingUrl,
        openBroadcast,
        participants: uniqueParticipantIds.length
          ? {
              create: uniqueParticipantIds.map((userId) => ({
                userId,
                status: userId === data.hostId ? 'host' : 'invited',
              })),
            }
          : undefined,
      },
      include: {
        host: { select: USER_SELECT },
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });
  }

  private base64url(input: Buffer | string) {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  private signJitsiJwt(payload: any, secret: string) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64url(JSON.stringify(header));
    const encodedPayload = this.base64url(JSON.stringify(payload));
    const data = `${encodedHeader}.${encodedPayload}`;
    const signature = createHmac('sha256', secret).update(data).digest();
    return `${data}.${this.base64url(signature)}`;
  }

  private async ensureVideoJoinAccess(meetingId: number, userId: number, role?: string) {
    if (role && VIDEO_ADMIN_ROLES.includes(role as any)) return;
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { hostId: true, openBroadcast: true },
    });
    if (!meeting) throw new NotFoundException('Video seans topilmadi');
    if (meeting.hostId === userId) return;
    if (meeting.openBroadcast && role === 'MOBILE_USER') return;
    const participant = await this.prisma.meetingParticipant.findFirst({ where: { meetingId, userId } });
    if (!participant) throw new ForbiddenException("Siz ushbu video seans ishtirokchisi emassiz");
  }

  async getVideoJoinToken(meetingId: number, requester: { userId: number; role?: string }) {
    const session = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        title: true,
        meetingUrl: true,
        hostId: true,
        host: { select: USER_SELECT },
      },
    });
    if (!session) throw new NotFoundException('Video seans topilmadi');

    await this.ensureVideoJoinAccess(meetingId, requester.userId, requester.role);

    let participantProfile: { firstName: string | null; lastName: string | null; email: string | null; phone: string | null } | null =
      null;
    if (session.hostId !== requester.userId) {
      participantProfile = await this.prisma.user.findUnique({
        where: { id: requester.userId },
        select: { firstName: true, lastName: true, email: true, phone: true },
      });
    }

    const displayName =
      session.hostId === requester.userId
        ? `${session.host.firstName || ''} ${session.host.lastName || ''}`.trim() || session.host.email || 'Host'
        : `${participantProfile?.firstName || ''} ${participantProfile?.lastName || ''}`.trim() ||
          participantProfile?.email ||
          participantProfile?.phone ||
          'Ishtirokchi';

    const url = session.meetingUrl || '';
    const domain = url ? new URL(url).host : (process.env.JITSI_DOMAIN || 'meet.jit.si');
    const roomId = url ? new URL(url).pathname.replace(/^\/+/, '') : `meeting-${meetingId}`;

    const appId = process.env.JITSI_APP_ID;
    const secret = process.env.JITSI_SECRET;

    // If Jitsi JWT isn't configured, return null token; client can still join public rooms.
    const token = appId && secret
      ? this.signJitsiJwt(
          {
            aud: 'jitsi',
            iss: appId,
            sub: domain,
            room: roomId,
            exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1h
            context: { user: { name: displayName } },
          },
          secret,
        )
      : null;

    return {
      domain,
      roomId,
      token,
      displayName,
      url: `https://${domain}/${roomId}${token ? `?jwt=${encodeURIComponent(token)}` : ''}`,
    };
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

  async findAllAnnouncements(query: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: number;
    publishedOnly?: boolean;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.centerId) where.centerId = query.centerId;

    const andParts: any[] = [];
    if (query.publishedOnly) {
      const now = new Date();
      andParts.push({ isPublished: true });
      andParts.push({ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] });
      andParts.push({ OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] });
    }
    if (query.search) {
      andParts.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { content: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (andParts.length) {
      where.AND = andParts;
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
