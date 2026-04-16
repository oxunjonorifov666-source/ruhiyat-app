import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class ReportsService {
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
      throw new ForbiddenException('Siz faqat o\'zingizning markazingizga tegishli hisobotlarni ko\'rishingiz mumkin');
    }

    where.centerId = requester.centerId;
  }

  async findAll(requester: AuthUser, query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    severity?: string;
    type?: string;
    centerId?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    this.enforceCenterIsolation(where, requester, query.centerId);

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
          center: { select: { id: true, name: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStats(requester: AuthUser, centerId?: number) {
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

    const [total, newCount, inReview, resolved, critical] = await Promise.all([
      this.prisma.moderationReport.count({ where }),
      this.prisma.moderationReport.count({ where: { ...where, status: 'NEW' } }),
      this.prisma.moderationReport.count({ where: { ...where, status: 'IN_REVIEW' } }),
      this.prisma.moderationReport.count({ where: { ...where, status: 'RESOLVED' } }),
      this.prisma.moderationReport.count({ where: { ...where, severity: 'CRITICAL' } }),
    ]);
    return { total, new: newCount, inReview, resolved, critical };
  }

  async findOne(requester: AuthUser, id: number, centerId?: number) {
    const where: any = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const report = await this.prisma.moderationReport.findFirst({
      where,
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        assignedTo: { select: { id: true, email: true, firstName: true, lastName: true } },
        resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
        center: { select: { id: true, name: true } },
      },
    });
    if (!report) throw new NotFoundException('Hisobot topilmadi');
    return report;
  }

  async create(requester: AuthUser, data: any) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN ? data.centerId : requester.centerId;
    
    return this.prisma.moderationReport.create({
      data: {
        type: data.type,
        targetType: data.targetType,
        targetId: data.targetId,
        summary: data.summary,
        details: data.details,
        severity: data.severity || 'MEDIUM',
        createdByUserId: requester.id,
        assignedToUserId: data.assignedToUserId,
        centerId: targetCenterId,
      },
      include: {
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(requester: AuthUser, id: number, centerId: number | undefined, data: any) {
    await this.findOne(requester, id, centerId);
    
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

  async resolve(requester: AuthUser, id: number, centerId: number | undefined, resolutionNote?: string) {
    await this.findOne(requester, id, centerId);
    
    return this.prisma.moderationReport.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedBy: requester.id,
        resolvedAt: new Date(),
        resolutionNote,
      },
    });
  }
}
