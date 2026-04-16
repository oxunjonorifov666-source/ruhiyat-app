import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPosts(query: {
    requesterId: number;
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean;
    isFlagged?: boolean;
    authorId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.isPublished !== undefined) where.isPublished = query.isPublished;
    if (query.isFlagged !== undefined) where.isFlagged = query.isFlagged;
    if (query.authorId) where.authorId = query.authorId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
        { author: { OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ]}},
      ];
    }

    const [posts, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    const liked = await this.prisma.communityPostLike.findMany({
      where: { userId: query.requesterId, postId: { in: posts.map((p: any) => p.id) } },
      select: { postId: true },
    });
    const likedSet = new Set(liked.map((l: any) => l.postId));

    const data = posts.map((p: any) => ({ ...p, isLiked: likedSet.has(p.id) }));
    return { data, total, page, limit };
  }

  async createPost(authorId: number, data: { title?: string; content?: string; imageUrl?: string }) {
    if (!data.content?.trim()) throw new ForbiddenException('Matn kiritish shart');
    return this.prisma.communityPost.create({
      data: {
        authorId,
        title: data.title?.trim() || null,
        content: data.content.trim(),
        imageUrl: data.imageUrl?.trim() || null,
        isPublished: true,
        isFlagged: false,
      },
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }

  async findPost(requesterId: number, id: number) {
    const post = await this.prisma.communityPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, email: true, firstName: true, lastName: true } },
        comments: {
          include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!post) throw new NotFoundException('Post topilmadi');
    const like = await this.prisma.communityPostLike.findUnique({
      where: { postId_userId: { postId: id, userId: requesterId } },
      select: { id: true },
    });
    return { ...post, isLiked: !!like };
  }

  async updatePost(requesterId: number, role: string, id: number, data: any) {
    const post = await this.prisma.communityPost.findUnique({ where: { id }, select: { id: true, authorId: true, isPublished: true, isFlagged: true } });
    if (!post) throw new NotFoundException('Post topilmadi');

    const isModerator = role === 'SUPERADMIN' || role === 'ADMINISTRATOR';
    const isOwner = post.authorId === requesterId;

    const updateData: any = {};

    if (data.title !== undefined || data.content !== undefined || data.imageUrl !== undefined) {
      if (!isOwner && !isModerator) throw new ForbiddenException("Ruxsat yo'q");
      if (data.title !== undefined) updateData.title = data.title ? String(data.title).trim() : null;
      if (data.content !== undefined) {
        const c = String(data.content).trim();
        if (!c) throw new ForbiddenException('Matn bo‘sh bo‘lishi mumkin emas');
        updateData.content = c;
      }
      if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl ? String(data.imageUrl).trim() : null;
    }

    if (data.isPublished !== undefined || data.isFlagged !== undefined) {
      if (!isModerator) throw new ForbiddenException("Faqat moderator o'zgartira oladi");
      if (data.isPublished !== undefined) updateData.isPublished = !!data.isPublished;
      if (data.isFlagged !== undefined) updateData.isFlagged = !!data.isFlagged;
    }

    const updated = await this.prisma.communityPost.update({ where: { id }, data: updateData });

    // Moderation log
    if (isModerator) {
      const actions: Array<{ action: string; reason?: string }> = [];
      if (data.isPublished !== undefined && data.isPublished !== post.isPublished) {
        actions.push({ action: data.isPublished ? 'PUBLISH' : 'UNPUBLISH' });
      }
      if (data.isFlagged !== undefined && data.isFlagged !== post.isFlagged) {
        actions.push({ action: data.isFlagged ? 'FLAG' : 'CLEAR_FLAG' });
      }
      await Promise.all(actions.map((a) =>
        this.prisma.moderationAction.create({
          data: { moderatorId: requesterId, targetType: 'COMMUNITY_POST', targetId: id, action: a.action, reason: a.reason },
        })
      ));
    }

    return updated;
  }

  async removePost(moderatorId: number, id: number) {
    await this.prisma.communityPost.delete({ where: { id } });
    await this.prisma.moderationAction.create({
      data: { moderatorId, targetType: 'COMMUNITY_POST', targetId: id, action: 'DELETE' },
    });
    return { message: "Post o'chirildi" };
  }

  async getComments(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(authorId: number, postId: number, data: any) {
    const content = String(data.content || '').trim();
    if (!content) throw new ForbiddenException('Izoh matni bo‘sh');
    const comment = await this.prisma.comment.create({ data: { postId, authorId, content } });
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });
    return comment;
  }

  async toggleLike(userId: number, postId: number) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) throw new NotFoundException('Post topilmadi');

    const existing = await this.prisma.communityPostLike.findUnique({
      where: { postId_userId: { postId, userId } },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.communityPostLike.delete({ where: { postId_userId: { postId, userId } } });
      const updated = await this.prisma.communityPost.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
        select: { id: true, likesCount: true },
      });
      return { ...updated, isLiked: false };
    }

    await this.prisma.communityPostLike.create({ data: { postId, userId } });
    const updated = await this.prisma.communityPost.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
      select: { id: true, likesCount: true },
    });
    return { ...updated, isLiked: true };
  }

  async reportPost(reporterId: number, postId: number, data: { reason: string; details?: string }) {
    const reason = String(data.reason || '').trim();
    if (!reason) throw new ForbiddenException('Sabab kiritish shart');
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true } });
    if (!post) throw new NotFoundException('Post topilmadi');

    const complaint = await this.prisma.complaint.create({
      data: {
        reporterId,
        targetType: 'COMMUNITY_POST',
        targetId: postId,
        subject: reason,
        description: data.details ? String(data.details) : null,
        priority: 'MEDIUM' as any,
        status: 'NEW' as any,
      },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.communityPost.update({ where: { id: postId }, data: { isFlagged: true } });

    await this.prisma.moderationAction.create({
      data: {
        moderatorId: reporterId,
        targetType: 'COMMUNITY_POST',
        targetId: postId,
        action: 'REPORT',
        reason,
        complaintId: complaint.id,
      },
    });

    return { message: 'Shikoyat yuborildi', complaintId: complaint.id };
  }

  async getPostReports(postId: number) {
    const complaints = await this.prisma.complaint.findMany({
      where: { targetType: 'COMMUNITY_POST', targetId: postId },
      include: {
        reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return complaints;
  }

  async createComplaint(data: any) { return this.prisma.complaint.create({ data }); }

  async findAllComplaints(query: { page?: number; limit?: number; status?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.status) where.status = query.status;
    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: {
          reporter: { select: { id: true, email: true, firstName: true, lastName: true } },
          resolver: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async updateComplaint(id: number, data: any) {
    return this.prisma.complaint.update({ where: { id }, data });
  }

  async findAllModerationActions(query: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.moderationAction.findMany({
        include: { moderator: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationAction.count(),
    ]);
    return { data, total, page, limit };
  }

  async createModerationAction(data: any) { return this.prisma.moderationAction.create({ data }); }
}
