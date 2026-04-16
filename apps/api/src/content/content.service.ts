import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from '../push/push-notification.service';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotification: PushNotificationService,
  ) {}

  async findAllArticles(query: {
    page?: number;
    limit?: number;
    search?: string;
    publishedOnly?: boolean;
    category?: string;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.publishedOnly) {
      where.isPublished = true;
    }
    if (query.category?.trim()) {
      where.category = { equals: query.category.trim(), mode: 'insensitive' };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.article.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.article.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findArticle(id: number) {
    const a = await this.prisma.article.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Maqola topilmadi');
    return a;
  }
  async createArticle(data: any) {
    const article = await this.prisma.article.create({ data });
    if (article.isPublished) {
      void this.pushNotification
        .notifyNewPublishedContent({ articleId: article.id, title: article.title })
        .catch(() => undefined);
    }
    return article;
  }
  async updateArticle(id: number, data: any) {
    const prev = await this.prisma.article.findUnique({ where: { id } });
    const article = await this.prisma.article.update({ where: { id }, data });
    const becamePublished = article.isPublished && !prev?.isPublished;
    if (becamePublished) {
      void this.pushNotification
        .notifyNewPublishedContent({ articleId: article.id, title: article.title })
        .catch(() => undefined);
    }
    return article;
  }
  async removeArticle(id: number) { await this.prisma.article.delete({ where: { id } }); return { message: "Maqola o'chirildi" }; }

  async findAllBanners(opts?: { activeOnly?: boolean }) {
    const where: any = {};
    if (opts?.activeOnly) {
      where.isActive = true;
      const now = new Date();
      where.AND = [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ];
    }
    return this.prisma.banner.findMany({ where, orderBy: { orderIndex: 'asc' } });
  }
  async createBanner(data: any) { return this.prisma.banner.create({ data }); }
  async updateBanner(id: number, data: any) { return this.prisma.banner.update({ where: { id }, data }); }
  async removeBanner(id: number) { await this.prisma.banner.delete({ where: { id } }); return { message: "Banner o'chirildi" }; }

  async findAllAudio(query: { page?: number; limit?: number; search?: string; publishedOnly?: boolean } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.publishedOnly) {
      where.isPublished = true;
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.audioContent.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.audioContent.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async findAudio(id: number) {
    const a = await this.prisma.audioContent.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Audio topilmadi');
    return a;
  }
  async createAudio(data: any) { return this.prisma.audioContent.create({ data }); }
  async updateAudio(id: number, data: any) { return this.prisma.audioContent.update({ where: { id }, data }); }
  async removeAudio(id: number) { await this.prisma.audioContent.delete({ where: { id } }); return { message: "Audio o'chirildi" }; }

  async findAllVideos(query: { page?: number; limit?: number; search?: string; publishedOnly?: boolean } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.publishedOnly) {
      where.isPublished = true;
    }
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.videoContent.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.videoContent.count({ where }),
    ]);
    return { data, total, page, limit };
  }
  async findVideo(id: number) {
    const v = await this.prisma.videoContent.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Video topilmadi');
    return v;
  }
  async createVideo(data: any) { return this.prisma.videoContent.create({ data }); }
  async updateVideo(id: number, data: any) { return this.prisma.videoContent.update({ where: { id }, data }); }
  async removeVideo(id: number) { await this.prisma.videoContent.delete({ where: { id } }); return { message: "Video o'chirildi" }; }

  async findAllAffirmations() { return this.prisma.affirmation.findMany({ orderBy: { orderIndex: 'asc' } }); }
  async createAffirmation(data: any) { return this.prisma.affirmation.create({ data }); }
  async updateAffirmation(id: number, data: any) { return this.prisma.affirmation.update({ where: { id }, data }); }
  async removeAffirmation(id: number) { await this.prisma.affirmation.delete({ where: { id } }); return { message: "Affirmatsiya o'chirildi" }; }

  async findAllProjectiveMethods() { return this.prisma.projectiveMethod.findMany(); }
  async findProjectiveMethod(id: number) {
    const p = await this.prisma.projectiveMethod.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Proektiv metod topilmadi');
    return p;
  }
  async createProjectiveMethod(data: any) { return this.prisma.projectiveMethod.create({ data }); }
  async updateProjectiveMethod(id: number, data: any) { return this.prisma.projectiveMethod.update({ where: { id }, data }); }
  async removeProjectiveMethod(id: number) { await this.prisma.projectiveMethod.delete({ where: { id } }); return { message: "Proektiv metod o'chirildi" }; }

  async findAllTrainings(opts?: { publishedOnly?: boolean }) {
    const where: any = {};
    if (opts?.publishedOnly) {
      where.isPublished = true;
    }
    return this.prisma.training.findMany({ where, orderBy: { createdAt: 'desc' } });
  }
  async findTraining(id: number) {
    const t = await this.prisma.training.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Trening topilmadi');
    return t;
  }
  async createTraining(data: any) { return this.prisma.training.create({ data }); }
  async updateTraining(id: number, data: any) { return this.prisma.training.update({ where: { id }, data }); }
  async removeTraining(id: number) { await this.prisma.training.delete({ where: { id } }); return { message: "Trening o'chirildi" }; }
}
