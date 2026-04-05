import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USER_SELECT = { id: true, email: true, firstName: true, lastName: true, role: true } as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getCenterPsychologistFilter(centerId?: number) {
    if (!centerId) return {};
    const psychologists = await this.prisma.psychologist.findMany({
      where: { centerId },
      select: { id: true },
    });
    return psychologists.length > 0
      ? { psychologistId: { in: psychologists.map((p) => p.id) } }
      : { id: -1 };
  }

  async getStats(centerId?: number) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const centerFilter = await this.getCenterPsychologistFilter(centerId);

    const [total, pending, accepted, completed, cancelled, rejected, todaySessions, monthSessions, paidCount, totalRevenueAgg] =
      await Promise.all([
        this.prisma.bookingSession.count({ where: centerFilter }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, status: 'PENDING' } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, status: 'ACCEPTED' } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, status: 'COMPLETED' } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, status: 'CANCELLED' } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, status: 'REJECTED' } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, createdAt: { gte: startOfToday } } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, createdAt: { gte: startOfMonth } } }),
        this.prisma.bookingSession.count({ where: { ...centerFilter, paymentStatus: 'PAID' } }),
        this.prisma.bookingSession.aggregate({ where: { ...centerFilter, paymentStatus: 'PAID' }, _sum: { price: true } }),
      ]);

    return {
      total,
      pending,
      accepted,
      completed,
      cancelled,
      rejected,
      todaySessions,
      monthSessions,
      paidCount,
      totalRevenue: totalRevenueAgg._sum.price || 0,
    };
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    psychologistId?: number;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
    centerId?: number;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const centerFilter = await this.getCenterPsychologistFilter(query.centerId);
    const where: any = { ...centerFilter };

    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query.psychologistId) where.psychologistId = query.psychologistId;
    if (query.userId) where.userId = query.userId;
    if (query.dateFrom || query.dateTo) {
      where.scheduledAt = {};
      if (query.dateFrom) where.scheduledAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.scheduledAt.lte = new Date(query.dateTo + 'T23:59:59');
    }
    if (query.search) {
      where.OR = [
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { psychologist: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { psychologist: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { notes: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bookingSession.findMany({
        where,
        include: {
          user: { select: USER_SELECT },
          psychologist: {
            select: { id: true, firstName: true, lastName: true, specialization: true, hourlyRate: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookingSession.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const session = await this.prisma.bookingSession.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        psychologist: {
          select: {
            id: true, firstName: true, lastName: true, specialization: true,
            hourlyRate: true, avatarUrl: true, rating: true, userId: true,
          },
        },
        meeting: {
          include: {
            participants: { include: { user: { select: USER_SELECT } } },
          },
        },
        chat: {
          include: {
            _count: { select: { messages: true } },
          },
        },
      },
    });
    if (!session) throw new NotFoundException("Seans topilmadi");
    return session;
  }

  async create(data: {
    userId: number;
    psychologistId: number;
    scheduledAt: string;
    duration?: number;
    notes?: string;
    administratorId?: number;
  }) {
    const psychologist = await this.prisma.psychologist.findUnique({
      where: { id: data.psychologistId },
    });
    if (!psychologist) throw new NotFoundException("Psixolog topilmadi");
    if (!psychologist.isAvailable) throw new BadRequestException("Psixolog hozirda mavjud emas");

    const price = (psychologist.hourlyRate || 0) * ((data.duration || 60) / 60);

    return this.prisma.bookingSession.create({
      data: {
        userId: data.userId,
        psychologistId: data.psychologistId,
        administratorId: data.administratorId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration || 60,
        price: Math.round(price),
        notes: data.notes,
      },
      include: {
        user: { select: USER_SELECT },
        psychologist: { select: { id: true, firstName: true, lastName: true, specialization: true } },
      },
    });
  }

  async accept(id: number) {
    const session = await this.getSessionOrThrow(id);
    this.validateTransition(session.status, 'ACCEPTED');

    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          title: `Seans #${session.id}`,
          type: 'CONSULTATION',
          hostId: session.psychologist.userId,
          scheduledAt: session.scheduledAt,
          duration: session.duration,
          meetingUrl: `https://meet.ruhiyat.uz/session-${session.id}`,
        },
      });

      await tx.meetingParticipant.createMany({
        data: [
          { meetingId: meeting.id, userId: session.psychologist.userId },
          { meetingId: meeting.id, userId: session.userId },
        ],
      });

      const chat = await tx.chat.create({
        data: {
          type: 'DIRECT',
          title: `Seans #${session.id} chat`,
          createdBy: session.psychologist.userId,
        },
      });

      await tx.chatParticipant.createMany({
        data: [
          { chatId: chat.id, userId: session.psychologist.userId },
          { chatId: chat.id, userId: session.userId },
        ],
      });

      return tx.bookingSession.update({
        where: { id },
        data: { status: 'ACCEPTED', meetingId: meeting.id, chatId: chat.id },
        include: {
          user: { select: USER_SELECT },
          psychologist: { select: { id: true, firstName: true, lastName: true, specialization: true } },
          meeting: true,
        },
      });
    });
  }

  async reject(id: number) {
    const session = await this.getSessionOrThrow(id);
    this.validateTransition(session.status, 'REJECTED');

    return this.prisma.bookingSession.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: {
        user: { select: USER_SELECT },
        psychologist: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async cancel(id: number, cancelledBy?: number, cancelReason?: string) {
    const session = await this.getSessionOrThrow(id);
    this.validateTransition(session.status, 'CANCELLED');

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = { status: 'CANCELLED' };
      if (cancelledBy) updateData.cancelledBy = cancelledBy;
      if (cancelReason) updateData.cancelReason = cancelReason;

      if (session.paymentStatus === 'PAID') {
        updateData.paymentStatus = 'REFUNDED';
        await tx.transaction.create({
          data: {
            userId: session.userId,
            psychologistId: session.psychologistId,
            type: 'REFUND',
            status: 'COMPLETED',
            amount: session.price,
            description: `Seans #${id} uchun qaytarish`,
            referenceId: `session-${id}-refund`,
          },
        });
      }

      return tx.bookingSession.update({
        where: { id },
        data: updateData,
        include: {
          user: { select: USER_SELECT },
          psychologist: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });
  }

  async complete(id: number) {
    const session = await this.getSessionOrThrow(id);
    this.validateTransition(session.status, 'COMPLETED');

    return this.prisma.$transaction(async (tx) => {
      if (session.meetingId) {
        await tx.meeting.update({
          where: { id: session.meetingId },
          data: { status: 'COMPLETED' },
        }).catch(() => {});
      }

      await tx.psychologist.update({
        where: { id: session.psychologistId },
        data: { totalSessions: { increment: 1 } },
      });

      return tx.bookingSession.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: {
          user: { select: USER_SELECT },
          psychologist: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });
  }

  async findByUser(userId: number, query: { page?: number; limit?: number; status?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.bookingSession.findMany({
        where,
        include: {
          psychologist: { select: { id: true, firstName: true, lastName: true, specialization: true, avatarUrl: true } },
          meeting: { select: { id: true, meetingUrl: true, status: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookingSession.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByPsychologist(userId: number, query: { page?: number; limit?: number; status?: string } = {}) {
    const psychologist = await this.prisma.psychologist.findUnique({ where: { userId } });
    if (!psychologist) throw new NotFoundException("Psixolog profili topilmadi");

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { psychologistId: psychologist.id };
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.bookingSession.findMany({
        where,
        include: {
          user: { select: USER_SELECT },
          meeting: { select: { id: true, meetingUrl: true, status: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookingSession.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  private async getSessionOrThrow(id: number) {
    const session = await this.prisma.bookingSession.findUnique({
      where: { id },
      include: {
        psychologist: { select: { id: true, userId: true, firstName: true, lastName: true } },
      },
    });
    if (!session) throw new NotFoundException("Seans topilmadi");
    return session;
  }

  private validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `"${currentStatus}" holatidan "${targetStatus}" holatiga o'tish mumkin emas`,
      );
    }
  }
}
