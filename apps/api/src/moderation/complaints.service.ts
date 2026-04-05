import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
    targetType?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getStats() {
    const [total, newCount, inReview, resolved, rejected, urgent] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.complaint.count({ where: { status: 'NEW' } }),
      this.prisma.complaint.count({ where: { status: 'IN_REVIEW' } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED' } }),
      this.prisma.complaint.count({ where: { status: 'REJECTED' } }),
      this.prisma.complaint.count({ where: { priority: 'URGENT' } }),
    ]);
    return { total, new: newCount, inReview, resolved, rejected, urgent };
  }

  async findOne(id: number) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
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
      },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.priority !== undefined && { priority: data.priority }),
      },
    });
  }

  async assign(id: number, assignedToUserId: number | null) {
    await this.findOne(id);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        assignedToUserId,
        status: assignedToUserId ? 'IN_REVIEW' : 'NEW',
      },
      include: {
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async resolve(id: number, userId: number, resolutionNote?: string) {
    await this.findOne(id);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote,
      },
    });
  }

  async reject(id: number, userId: number, resolutionNote?: string) {
    await this.findOne(id);
    return this.prisma.complaint.update({
      where: { id },
      data: {
        status: 'REJECTED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote,
      },
    });
  }
}
