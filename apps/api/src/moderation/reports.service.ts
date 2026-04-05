import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    severity?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.search) {
      where.OR = [
        { summary: { contains: query.search, mode: 'insensitive' } },
        { details: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.type) where.type = query.type;

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    orderBy[sortField] = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        include: {
          createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
          resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getStats() {
    const [total, newCount, inReview, resolved, critical] = await Promise.all([
      this.prisma.moderationReport.count(),
      this.prisma.moderationReport.count({ where: { status: 'NEW' } }),
      this.prisma.moderationReport.count({ where: { status: 'IN_REVIEW' } }),
      this.prisma.moderationReport.count({ where: { status: 'RESOLVED' } }),
      this.prisma.moderationReport.count({ where: { severity: 'CRITICAL' } }),
    ]);
    return { total, new: newCount, inReview, resolved, critical };
  }

  async findOne(id: number) {
    const report = await this.prisma.moderationReport.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
    if (!report) throw new NotFoundException('Hisobot topilmadi');
    return report;
  }

  async create(data: any, userId: number) {
    return this.prisma.moderationReport.create({
      data: {
        type: data.type,
        targetType: data.targetType,
        targetId: data.targetId,
        summary: data.summary,
        details: data.details,
        severity: data.severity || 'MEDIUM',
        createdByUserId: userId,
        assignedToUserId: data.assignedToUserId,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.moderationReport.update({
      where: { id },
      data: {
        ...(data.summary !== undefined && { summary: data.summary }),
        ...(data.details !== undefined && { details: data.details }),
        ...(data.severity !== undefined && { severity: data.severity }),
        ...(data.assignedToUserId !== undefined && { assignedToUserId: data.assignedToUserId }),
      },
    });
  }

  async resolve(id: number, userId: number, resolutionNote?: string) {
    await this.findOne(id);
    return this.prisma.moderationReport.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolutionNote,
      },
    });
  }
}
