import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    contentType?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.search) {
      where.contentTitle = { contains: query.search, mode: 'insensitive' };
    }
    if (query.status) where.status = query.status;
    if (query.contentType) where.contentType = query.contentType;

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    orderBy[sortField] = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.contentModeration.findMany({
        where,
        include: {
          moderator: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.contentModeration.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getStats() {
    const [total, pending, approved, rejected, hidden] = await Promise.all([
      this.prisma.contentModeration.count(),
      this.prisma.contentModeration.count({ where: { status: 'PENDING' } }),
      this.prisma.contentModeration.count({ where: { status: 'APPROVED' } }),
      this.prisma.contentModeration.count({ where: { status: 'REJECTED' } }),
      this.prisma.contentModeration.count({ where: { status: 'HIDDEN' } }),
    ]);
    return { total, pending, approved, rejected, hidden };
  }

  async approve(id: number, userId: number, moderatorNote?: string) {
    const item = await this.prisma.contentModeration.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Kontent moderatsiya elementi topilmadi');

    return this.prisma.contentModeration.update({
      where: { id },
      data: {
        status: 'APPROVED',
        moderatorId: userId,
        moderatorNote,
        reviewedAt: new Date(),
      },
    });
  }

  async reject(id: number, userId: number, moderatorNote?: string) {
    const item = await this.prisma.contentModeration.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Kontent moderatsiya elementi topilmadi');

    return this.prisma.contentModeration.update({
      where: { id },
      data: {
        status: 'REJECTED',
        moderatorId: userId,
        moderatorNote,
        reviewedAt: new Date(),
      },
    });
  }

  async hide(id: number, userId: number, moderatorNote?: string) {
    const item = await this.prisma.contentModeration.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Kontent moderatsiya elementi topilmadi');

    return this.prisma.contentModeration.update({
      where: { id },
      data: {
        status: 'HIDDEN',
        moderatorId: userId,
        moderatorNote,
        reviewedAt: new Date(),
      },
    });
  }

  async deleteContent(id: number, userId: number, moderatorNote?: string) {
    const item = await this.prisma.contentModeration.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Kontent moderatsiya elementi topilmadi');

    // Best-effort soft delete for known content types
    await this.prisma.$transaction(async (tx) => {
      const ct = (item.contentType || '').toLowerCase();
      const cid = item.contentId;

      if (ct === 'article') {
        await tx.article.update({ where: { id: cid }, data: { isPublished: false } }).catch(() => {});
      } else if (ct === 'banner') {
        await tx.banner.update({ where: { id: cid }, data: { isActive: false } }).catch(() => {});
      } else if (ct === 'video') {
        await tx.videoContent.update({ where: { id: cid }, data: { isPublished: false } }).catch(() => {});
      } else if (ct === 'audio') {
        await tx.audioContent.update({ where: { id: cid }, data: { isPublished: false } }).catch(() => {});
      } else if (ct === 'affirmation') {
        await tx.affirmation.update({ where: { id: cid }, data: { isActive: false } }).catch(() => {});
      } else if (ct === 'test') {
        await tx.test.update({ where: { id: cid }, data: { isPublished: false } }).catch(() => {});
      } else if (ct === 'training') {
        await tx.training.update({ where: { id: cid }, data: { isPublished: false } }).catch(() => {});
      }

      await tx.contentModeration.update({
        where: { id },
        data: {
          status: 'HIDDEN',
          moderatorId: userId,
          moderatorNote: moderatorNote ? `[DELETE] ${moderatorNote}` : '[DELETE]',
          reviewedAt: new Date(),
        },
      });
    });

    return this.prisma.contentModeration.findUnique({ where: { id } });
  }
}
