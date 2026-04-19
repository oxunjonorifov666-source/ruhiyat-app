import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityObservabilityService } from '../observability/security-observability.service';
import { AuthUser, UserRole } from '@ruhiyat/types';
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { UpdateMeetingDto } from './dto/update-meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityObs: SecurityObservabilityService,
  ) {}

  /**
   * Meeting is visible to a center if the host is that center's admin/psych,
   * or a linked booking session / participant ties it to that center's psychologist or admin user.
   */
  private meetingInCenterScope(centerId: number): Prisma.MeetingWhereInput {
    return {
      OR: [
        { host: { administrator: { centerId } } },
        { host: { psychologist: { centerId } } },
        { bookingSessions: { some: { psychologist: { centerId } } } },
        {
          participants: {
            some: { user: { psychologist: { centerId } } },
          },
        },
        {
          participants: {
            some: { user: { administrator: { centerId } } },
          },
        },
      ],
    };
  }

  private resolveScopeCenterId(
    query: { centerId?: string | number },
    requester: AuthUser,
  ): { scope: Prisma.MeetingWhereInput | null } {
    if (requester.role === UserRole.SUPERADMIN) {
      const raw = query.centerId;
      if (raw === undefined || raw === null || raw === '') {
        return { scope: null };
      }
      const cid =
        typeof raw === 'number' ? raw : parseInt(String(raw), 10);
      if (!Number.isFinite(cid)) {
        return { scope: null };
      }
      return {
        scope: this.meetingInCenterScope(cid),
      };
    }

    const cid = requester.centerId ?? null;
    if (cid == null) {
      throw new ForbiddenException(
        'Markaz aniqlanmadi — uchrashuvlar ro‘yxatiga kirish mumkin emas',
      );
    }
    if (
      query.centerId !== undefined &&
      query.centerId !== null &&
      query.centerId !== '' &&
      parseInt(String(query.centerId), 10) !== cid
    ) {
      throw new ForbiddenException('Boshqa markaz bo‘yicha ma’lumot so‘rash mumkin emas');
    }
    return {
      scope: this.meetingInCenterScope(cid),
    };
  }

  /** Ensures meeting exists; superadmin passes; others must match center scope. */
  private async assertMeetingAccessible(
    meetingId: number,
    requester: AuthUser,
  ): Promise<void> {
    const exists = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Uchrashuv topilmadi');
    }
    if (requester.role === UserRole.SUPERADMIN) {
      return;
    }
    const cid = requester.centerId ?? null;
    if (cid == null) {
      throw new ForbiddenException('Ruxsat yo‘q');
    }
    const n = await this.prisma.meeting.count({
      where: {
        id: meetingId,
        AND: [this.meetingInCenterScope(cid)],
      },
    });
    if (n === 0) {
      throw new ForbiddenException(
        'Ushbu uchrashuvga kirish huquqi yo‘q yoki u markazingizga tegishli emas',
      );
    }
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      centerId?: string | number;
    } = {},
    requester: AuthUser,
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const { scope } = this.resolveScopeCenterId(query, requester);

    const filters: Prisma.MeetingWhereInput[] = [];
    if (scope) {
      filters.push(scope);
    }
    if (query.search?.trim()) {
      filters.push({
        title: { contains: query.search.trim(), mode: 'insensitive' },
      });
    }
    if (query.status) {
      filters.push({ status: query.status as any });
    }

    const where: Prisma.MeetingWhereInput =
      filters.length === 0
        ? {}
        : filters.length === 1
          ? filters[0]
          : { AND: filters };

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

  async findOne(id: number, requester: AuthUser) {
    const m = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, email: true, firstName: true, lastName: true } },
        participants: {
          include: {
            user: { select: { id: true, email: true, firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!m) {
      throw new NotFoundException('Uchrashuv topilmadi');
    }
    if (requester.role !== UserRole.SUPERADMIN) {
      const cid = requester.centerId ?? null;
      if (cid == null) {
        throw new ForbiddenException('Ruxsat yo‘q');
      }
      const n = await this.prisma.meeting.count({
        where: {
          id,
          AND: [this.meetingInCenterScope(cid)],
        },
      });
      if (n === 0) {
        throw new ForbiddenException(
          'Ushbu uchrashuvga kirish huquqi yo‘q yoki u markazingizga tegishli emas',
        );
      }
    }
    return m;
  }

  /**
   * Create meeting: host is always the authenticated user for non–superadmin callers
   * (prevents `hostId` in JSON from assigning a meeting to another user / center).
   */
  async create(data: CreateMeetingDto, requester: AuthUser) {
    if (requester.role !== UserRole.SUPERADMIN && data.hostId != null) {
      throw new BadRequestException('hostId faqat superadmin tomonidan belgilanadi');
    }
    if (data.title == null || String(data.title).trim() === '') {
      throw new BadRequestException('Sarlavha (title) majburiy');
    }
    if (!Number.isFinite(data.duration) || data.duration < 0) {
      throw new BadRequestException('Davomiylik (duration) noto‘g‘ri');
    }

    const createData: Prisma.MeetingCreateInput = {
      title: data.title.trim(),
      description: data.description ?? null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
      duration: data.duration,
      meetingUrl: data.meetingUrl?.trim() || null,
      notes: data.notes ?? null,
      openBroadcast: data.openBroadcast ?? false,
      host: { connect: { id: requester.id } },
    };
    if (data.type !== undefined) createData.type = data.type;
    if (data.status !== undefined) createData.status = data.status;

    if (requester.role === UserRole.SUPERADMIN) {
      const hostId = data.hostId;
      if (hostId == null || !Number.isFinite(hostId)) {
        throw new BadRequestException('hostId (uchrashuv ega foydalanuvchi) majburiy');
      }
      createData.host = { connect: { id: hostId } };
    }

    return this.prisma.meeting.create({ data: createData });
  }

  async update(id: number, data: UpdateMeetingDto, requester: AuthUser) {
    await this.assertMeetingAccessible(id, requester);
    if (requester.role !== UserRole.SUPERADMIN) {
      if (data.hostId != null) {
        throw new ForbiddenException("Uchrashuv egasini o'zgartirish markaz admini uchun berilmagan");
      }
    }

    const patch: Prisma.MeetingUpdateInput = {};
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.description !== undefined) patch.description = data.description;
    if (data.type !== undefined) patch.type = data.type;
    if (data.status !== undefined) patch.status = data.status;
    if (data.scheduledAt !== undefined) patch.scheduledAt = new Date(data.scheduledAt);
    if (data.duration !== undefined) patch.duration = data.duration;
    if (data.meetingUrl !== undefined) patch.meetingUrl = data.meetingUrl?.trim() || null;
    if (data.openBroadcast !== undefined) patch.openBroadcast = data.openBroadcast;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (requester.role === UserRole.SUPERADMIN && data.hostId !== undefined) {
      patch.host = { connect: { id: data.hostId } };
    }

    if (Object.keys(patch).length === 0) {
      return this.findOne(id, requester);
    }
    return this.prisma.meeting.update({ where: { id }, data: patch });
  }

  async remove(id: number, requester: AuthUser) {
    await this.assertMeetingAccessible(id, requester);
    await this.prisma.meeting.delete({ where: { id } });
    await this.securityObs.record({
      event: 'MEETING_DELETED',
      userId: requester.id,
      success: true,
      details: { actorRole: requester.role, meetingId: id },
    });
    return { message: "Uchrashuv o'chirildi" };
  }

  /**
   * Self-join only: participant userId is always the authenticated user.
   * Re-join clears leftAt and refreshes joinedAt (idempotent).
   */
  async join(meetingId: number, requester: AuthUser) {
    await this.assertMeetingAccessible(meetingId, requester);
    const userId = requester.id;
    return this.prisma.meetingParticipant.upsert({
      where: { meetingId_userId: { meetingId, userId } },
      create: {
        meetingId,
        userId,
        joinedAt: new Date(),
        status: 'joined',
      },
      update: {
        joinedAt: new Date(),
        leftAt: null,
        status: 'joined',
      },
    });
  }

  /**
   * Self-leave only: marks leftAt for the authenticated user.
   */
  async leave(meetingId: number, requester: AuthUser) {
    await this.assertMeetingAccessible(meetingId, requester);
    const result = await this.prisma.meetingParticipant.updateMany({
      where: { meetingId, userId: requester.id },
      data: { leftAt: new Date() },
    });
    return { left: result.count > 0, affected: result.count };
  }

  /**
   * Privileged: mark another user as left (e.g. center admin). Requires meetings.write.
   * Does not use client-controlled identity for the requester — only target userId from URL.
   */
  async removeParticipant(
    meetingId: number,
    targetUserId: number,
    requester: AuthUser,
  ) {
    await this.assertMeetingAccessible(meetingId, requester);
    if (targetUserId === requester.id) {
      return this.leave(meetingId, requester);
    }
    const result = await this.prisma.meetingParticipant.updateMany({
      where: { meetingId, userId: targetUserId },
      data: { leftAt: new Date() },
    });
    if (result.count === 0) {
      throw new NotFoundException('Ishtirokchi topilmadi yoki allaqachon chiqib ketgan');
    }
    await this.securityObs.record({
      event: 'MEETING_PARTICIPANT_REMOVED',
      userId: requester.id,
      success: true,
      details: {
        actorRole: requester.role,
        meetingId,
        targetUserId,
        self: false,
      },
    });
    return { removed: true, affected: result.count };
  }
}
