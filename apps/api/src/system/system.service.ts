import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async findAuditLogs(requester: AuthUser, query: any = {}) { 
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (requester.role !== UserRole.SUPERADMIN) {
      if (!requester.centerId) {
        throw new ForbiddenException('Sizda audit jurnallarini ko\'rish huquqi yo\'q');
      }
      where.centerId = requester.centerId;
    } else if (query.centerId) {
      where.centerId = parseInt(query.centerId as any);
    }

    if (query.userId) where.userId = parseInt(query.userId as any);
    if (query.action) where.action = query.action;
    if (query.resource) where.resource = query.resource;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }
    if (query.search) {
      where.OR = [
        { resource: { contains: query.search, mode: 'insensitive' } },
        { action: { contains: query.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ 
        where,
        include: { 
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
          center: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }, 
        skip,
        take: limit 
      }),
      this.prisma.auditLog.count({ where })
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAuditLogById(requester: AuthUser, id: number) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        center: { select: { id: true, name: true } },
      },
    });
    if (!log) throw new NotFoundException('Log topilmadi');

    if (requester.role !== UserRole.SUPERADMIN) {
      if (!requester.centerId || log.centerId !== requester.centerId) {
        throw new ForbiddenException("Ruxsat yo'q");
      }
    }

    return log;
  }

  async findSettings(requester: AuthUser) { 
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin tizim sozlamalarini ko\'rishi mumkin');
    }
    const [data, total] = await Promise.all([
      this.prisma.systemSetting.findMany(),
      this.prisma.systemSetting.count()
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async updateSetting(requester: AuthUser, key: string, data: any) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin tizim sozlamalarini o\'zgartirishi mumkin');
    }
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: data.value, updatedBy: requester.id },
      create: { key, value: data.value, category: data.category || 'general', updatedBy: requester.id },
    });
  }

  async findMobileSettings(requester: AuthUser) { 
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin mobil ilova sozlamalarini ko\'rishi mumkin');
    }
    const [data, total] = await Promise.all([
      this.prisma.mobileAppSetting.findMany(),
      this.prisma.mobileAppSetting.count()
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async updateMobileSetting(requester: AuthUser, key: string, data: any) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin mobil ilova sozlamalarini o\'zgartirishi mumkin');
    }
    return this.prisma.mobileAppSetting.upsert({
      where: { key },
      update: { value: data.value, updatedBy: requester.id },
      create: { key, value: data.value, platform: data.platform || 'all', updatedBy: requester.id },
    });
  }

  /** Mobil ilova: AI Dilosh sozlamalari (API kalitsiz). */
  async getPublicAiDiloshConfig() {
    const rows = await this.prisma.mobileAppSetting.findMany({
      where: {
        AND: [
          { key: { startsWith: 'ai_dilosh_' } },
          { key: { not: 'ai_dilosh_api_key' } },
        ],
      },
    });
    const out: Record<string, string> = {};
    for (const r of rows) {
      if (r.value != null) out[r.key] = r.value;
    }
    return out;
  }

  async findApiKeys(requester: AuthUser) { 
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin API kalitlarini boshqarishi mumkin');
    }
    const [data, total] = await Promise.all([
      this.prisma.apiKey.findMany({ 
        select: { id: true, name: true, keyPrefix: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true } 
      }),
      this.prisma.apiKey.count()
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async createApiKey(requester: AuthUser, data: any) { 
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin API kalitlarini yaratishi mumkin');
    }

    const rawKey = `rk_${randomBytes(24).toString('base64url')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 8);

    const apiKey = await this.prisma.apiKey.create({ 
      data: { 
        name: data.name,
        keyHash,
        keyPrefix,
        permissions: Array.isArray(data.permissions) ? data.permissions : ['*'],
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: requester.id,
      },
      select: { id: true, name: true, keyPrefix: true, isActive: true, lastUsedAt: true, expiresAt: true, createdAt: true },
    });

    return { key: rawKey, apiKey };
  }

  async removeApiKey(requester: AuthUser, id: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin API kalitlarini o\'chirishi mumkin');
    }
    await this.prisma.apiKey.delete({ where: { id } });
    return { message: 'API kaliti o\'chirildi' };
  }

  async findIntegrations(requester: AuthUser) { 
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin integratsiyalarni ko\'rishi mumkin');
    }
    const [data, total] = await Promise.all([
      this.prisma.integrationSetting.findMany(),
      this.prisma.integrationSetting.count()
    ]);
    return { data, total, page: 1, limit: data.length };
  }

  async updateIntegration(requester: AuthUser, id: number, data: any) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin integratsiyalarni o\'zgartirishi mumkin');
    }
    return this.prisma.integrationSetting.update({ 
      where: { id }, 
      data: { ...data } 
    });
  }

  async findAuthSessions(requester: AuthUser, query: any = {}) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin auth seanslarni ko\'ra oladi');
    }
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.session.count(),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async revokeAuthSession(requester: AuthUser, id: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin seansni bekor qila oladi');
    }
    await this.prisma.session.update({
      where: { id },
      data: { isRevoked: true },
    });
    return { message: 'Seans bekor qilindi' };
  }
}
