import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.meeting.findMany({ include: { participants: true }, orderBy: { scheduledAt: 'desc' } }); }

  async findOne(id: number) {
    const m = await this.prisma.meeting.findUnique({ where: { id }, include: { participants: true, host: { select: { id: true, email: true } } } });
    if (!m) throw new NotFoundException('Meeting not found');
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
    return { message: 'Meeting deleted' };
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
