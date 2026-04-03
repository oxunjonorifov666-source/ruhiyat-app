import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async findAuditLogs() { return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }); }

  async findSettings() { return this.prisma.systemSetting.findMany(); }

  async updateSetting(key: string, data: any) {
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: data.value, updatedBy: data.updatedBy },
      create: { key, value: data.value, category: data.category || 'general' },
    });
  }

  async findMobileSettings() { return this.prisma.mobileAppSetting.findMany(); }

  async updateMobileSetting(key: string, data: any) {
    return this.prisma.mobileAppSetting.upsert({
      where: { key },
      update: { value: data.value, updatedBy: data.updatedBy },
      create: { key, value: data.value, platform: data.platform || 'all' },
    });
  }

  async findApiKeys() { return this.prisma.apiKey.findMany({ select: { id: true, name: true, keyPrefix: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true } }); }

  async createApiKey(data: any) { return this.prisma.apiKey.create({ data }); }

  async removeApiKey(id: number) {
    await this.prisma.apiKey.delete({ where: { id } });
    return { message: 'API key deleted' };
  }

  async findIntegrations() { return this.prisma.integrationSetting.findMany(); }

  async updateIntegration(id: number, data: any) {
    return this.prisma.integrationSetting.update({ where: { id }, data });
  }
}
