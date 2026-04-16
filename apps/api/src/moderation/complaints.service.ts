import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  private enforceCenterIsolation(where: any, requester: AuthUser, explicitCenterId?: number) {
    if (requester.role === UserRole.SUPERADMIN) {
      if (explicitCenterId) where.centerId = explicitCenterId;
      return;
    }

    if (requester.centerId === null || requester.centerId === undefined) {
      throw new ForbiddenException('Sizda ushbu ma\'lumotlarga kirish huquqi yo\'q (markaz tayinlanmagan)');
    }

    if (explicitCenterId && explicitCenterId !== requester.centerId) {
      throw new ForbiddenException('Siz faqat o\'zingizning markazingizga tegishli shikoyatlarni ko\'rishingiz mumkin');
    }

    where.centerId = requester.centerId;
  }

  async findAll(
    requester: AuthUser,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      priority?: string;
      targetType?: string;
      sortBy?: string;
      sortOrder?: string;
      centerId?: number;
    },
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    this.enforceCenterIsolation(where, requester, query.centerId);

    if (query.search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { subject: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.targetType) where.targetType = query.targetType;

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    orderBy[sortField] = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
          center: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats(requester: AuthUser, centerId?: number) {
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

    const [total, newCount, inReview, resolved, rejected, urgent] = await Promise.all([
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.count({ where: { ...where, status: 'NEW' } }),
      this.prisma.complaint.count({ where: { ...where, status: 'IN_REVIEW' } }),
      this.prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } }),
      this.prisma.complaint.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.complaint.count({ where: { ...where, priority: 'URGENT' } }),
    ]);
    return { total, new: newCount, inReview, resolved, rejected, urgent };
  }

  async findOne(requester: AuthUser, id: number, centerId?: number) {
    const where: any = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const complaint = await this.prisma.complaint.findFirst({
      where,
      include: {
        reporter: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
        moderationActions: {
          include: { moderator: { select: { id: true, email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!complaint) throw new NotFoundException('Shikoyat topilmadi');
    return complaint;
  }

  async create(data: any) {
    return this.prisma.complaint.create({
      data: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        subject: data.subject,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        centerId: data.centerId,
      },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(requester: AuthUser, id: number, centerId: number | undefined, data: any) {
    await this.findOne(requester, id, centerId);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
      },
    });
  }

  async assign(requester: AuthUser, id: number, assignedToUserId: number | null, centerId?: number) {
    await this.findOne(requester, id, centerId);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        assignedToUserId,
        status: assignedToUserId ? 'IN_REVIEW' : 'NEW',
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
      },
    });
  }

  async resolve(requester: AuthUser, id: number, userId: number, resolutionNote: string | undefined, centerId?: number) {
    await this.findOne(requester, id, centerId);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote,
      },
      include: {
        resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
      },
    });
  }

  async reject(requester: AuthUser, id: number, userId: number, resolutionNote: string | undefined, centerId?: number) {
    await this.findOne(requester, id, centerId);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'REJECTED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote,
      },
      include: {
        resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
      },
    });
  }
}
