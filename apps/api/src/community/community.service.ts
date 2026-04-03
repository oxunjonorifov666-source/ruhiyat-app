import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPosts() { return this.prisma.communityPost.findMany({ include: { author: { select: { id: true, email: true } } }, orderBy: { createdAt: 'desc' } }); }

  async createPost(data: any) { return this.prisma.communityPost.create({ data }); }

  async findPost(id: number) {
    const post = await this.prisma.communityPost.findUnique({ where: { id }, include: { author: { select: { id: true, email: true } }, comments: true } });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async updatePost(id: number, data: any) {
    return this.prisma.communityPost.update({ where: { id }, data });
  }

  async removePost(id: number) {
    await this.prisma.communityPost.delete({ where: { id } });
    return { message: 'Post deleted' };
  }

  async getComments(postId: number) {
    return this.prisma.comment.findMany({ where: { postId }, orderBy: { createdAt: 'asc' } });
  }

  async addComment(postId: number, data: any) {
    return this.prisma.comment.create({ data: { postId, ...data } });
  }

  async createComplaint(data: any) { return this.prisma.complaint.create({ data }); }
  async findAllComplaints() { return this.prisma.complaint.findMany({ orderBy: { createdAt: 'desc' } }); }
  async updateComplaint(id: number, data: any) { return this.prisma.complaint.update({ where: { id }, data }); }
  async findAllModerationActions() { return this.prisma.moderationAction.findMany({ orderBy: { createdAt: 'desc' } }); }
  async createModerationAction(data: any) { return this.prisma.moderationAction.create({ data }); }
}
