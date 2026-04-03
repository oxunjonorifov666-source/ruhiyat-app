import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPosts(query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.communityPost.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createPost(data: any) { return this.prisma.communityPost.create({ data }); }

  async findPost(id: number) {
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
    return post;
  }

  async updatePost(id: number, data: any) {
    return this.prisma.communityPost.update({ where: { id }, data });
  }

  async removePost(id: number) {
    await this.prisma.communityPost.delete({ where: { id } });
    return { message: "Post o'chirildi" };
  }

  async getComments(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: { author: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(postId: number, data: any) {
    const comment = await this.prisma.comment.create({ data: { postId, ...data } });
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });
    return comment;
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
