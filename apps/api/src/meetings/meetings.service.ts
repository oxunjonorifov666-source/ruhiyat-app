import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          host: { select: { id: true, email: true, firstName: true, lastName: true } },
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

  async findOne(id: number) {
    const m = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, email: true, firstName: true, lastName: true } },
        participants: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } },
      },
    });
    if (!m) throw new NotFoundException('Uchrashuv topilmadi');
    return m;
  }

  async create(data: any) { return this.prisma.meeting.create({ data }); }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.meeting.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.meeting.delete({ where: { id } });
    return { message: "Uchrashuv o'chirildi" };
  }

  async join(meetingId: number, data: any) {
    return this.prisma.meetingParticipant.create({ data: { meetingId, ...data, joinedAt: new Date() } });
  }

  async leave(meetingId: number, data: any) {
    return this.prisma.meetingParticipant.updateMany({
      where: { meetingId, userId: data.userId },
      data: { leftAt: new Date() },
    });
  }
}
