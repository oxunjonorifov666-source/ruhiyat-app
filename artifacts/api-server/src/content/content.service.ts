import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllArticles() { return this.prisma.article.findMany({ orderBy: { createdAt: 'desc' } }); }
  async findArticle(id: number) {
    const a = await this.prisma.article.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Article not found');
    return a;
  }
  async createArticle(data: any) { return this.prisma.article.create({ data }); }
  async updateArticle(id: number, data: any) { return this.prisma.article.update({ where: { id }, data }); }
  async removeArticle(id: number) { await this.prisma.article.delete({ where: { id } }); return { message: 'Article deleted' }; }

  async findAllBanners() { return this.prisma.banner.findMany({ orderBy: { orderIndex: 'asc' } }); }
  async createBanner(data: any) { return this.prisma.banner.create({ data }); }
  async updateBanner(id: number, data: any) { return this.prisma.banner.update({ where: { id }, data }); }
  async removeBanner(id: number) { await this.prisma.banner.delete({ where: { id } }); return { message: 'Banner deleted' }; }

  async findAllAudio() { return this.prisma.audioContent.findMany({ orderBy: { createdAt: 'desc' } }); }
  async findAudio(id: number) {
    const a = await this.prisma.audioContent.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Audio not found');
    return a;
  }
  async createAudio(data: any) { return this.prisma.audioContent.create({ data }); }
  async updateAudio(id: number, data: any) { return this.prisma.audioContent.update({ where: { id }, data }); }
  async removeAudio(id: number) { await this.prisma.audioContent.delete({ where: { id } }); return { message: 'Audio deleted' }; }

  async findAllVideos() { return this.prisma.videoContent.findMany({ orderBy: { createdAt: 'desc' } }); }
  async findVideo(id: number) {
    const v = await this.prisma.videoContent.findUnique({ where: { id } });
    if (!v) throw new NotFoundException('Video not found');
    return v;
  }
  async createVideo(data: any) { return this.prisma.videoContent.create({ data }); }
  async updateVideo(id: number, data: any) { return this.prisma.videoContent.update({ where: { id }, data }); }
  async removeVideo(id: number) { await this.prisma.videoContent.delete({ where: { id } }); return { message: 'Video deleted' }; }

  async findAllAffirmations() { return this.prisma.affirmation.findMany({ orderBy: { orderIndex: 'asc' } }); }
  async createAffirmation(data: any) { return this.prisma.affirmation.create({ data }); }
  async updateAffirmation(id: number, data: any) { return this.prisma.affirmation.update({ where: { id }, data }); }
  async removeAffirmation(id: number) { await this.prisma.affirmation.delete({ where: { id } }); return { message: 'Affirmation deleted' }; }

  async findAllProjectiveMethods() { return this.prisma.projectiveMethod.findMany(); }
  async findProjectiveMethod(id: number) {
    const p = await this.prisma.projectiveMethod.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Projective method not found');
    return p;
  }
  async createProjectiveMethod(data: any) { return this.prisma.projectiveMethod.create({ data }); }
  async updateProjectiveMethod(id: number, data: any) { return this.prisma.projectiveMethod.update({ where: { id }, data }); }
  async removeProjectiveMethod(id: number) { await this.prisma.projectiveMethod.delete({ where: { id } }); return { message: 'Projective method deleted' }; }

  async findAllTrainings() { return this.prisma.training.findMany(); }
  async findTraining(id: number) {
    const t = await this.prisma.training.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Training not found');
    return t;
  }
  async createTraining(data: any) { return this.prisma.training.create({ data }); }
  async updateTraining(id: number, data: any) { return this.prisma.training.update({ where: { id }, data }); }
  async removeTraining(id: number) { await this.prisma.training.delete({ where: { id } }); return { message: 'Training deleted' }; }
}
