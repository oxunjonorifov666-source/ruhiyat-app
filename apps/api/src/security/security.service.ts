import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

const ADMIN_ROLES = [UserRole.SUPERADMIN, UserRole.ADMINISTRATOR] as const;

function requireAdmin(requester: AuthUser) {
  if (!ADMIN_ROLES.includes(requester.role as any)) {
    throw new ForbiddenException("Ruxsat yo'q");
  }
}

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  async getPolicy(requester: AuthUser) {
    requireAdmin(requester);

    const keys = [
      'security.passwordMinLength',
      'security.passwordRequireUpperLowerDigit',
      'security.passwordRequireSpecial',
    ];

    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true, updatedAt: true },
    });

    const get = (key: string) => rows.find((r) => r.key === key)?.value ?? null;

    return {
      passwordMinLength: parseInt((get(keys[0]) as any) || '8', 10),
      passwordRequireUpperLowerDigit: ((get(keys[1]) as any) ?? 'true') === 'true',
      passwordRequireSpecial: ((get(keys[2]) as any) ?? 'false') === 'true',
      updatedAt: rows.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))[0]?.updatedAt || null,
    };
  }

  async updatePolicy(requester: AuthUser, body: any) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin siyosatni o‘zgartira oladi');
    }

    const passwordMinLength = Math.min(64, Math.max(6, Number(body.passwordMinLength || 8)));
    const passwordRequireUpperLowerDigit = !!body.passwordRequireUpperLowerDigit;
    const passwordRequireSpecial = !!body.passwordRequireSpecial;

    await this.prisma.systemSetting.upsert({
      where: { key: 'security.passwordMinLength' },
      update: { value: String(passwordMinLength), updatedBy: requester.id },
      create: { key: 'security.passwordMinLength', value: String(passwordMinLength), category: 'security', updatedBy: requester.id },
    });
    await this.prisma.systemSetting.upsert({
      where: { key: 'security.passwordRequireUpperLowerDigit' },
      update: { value: String(passwordRequireUpperLowerDigit), updatedBy: requester.id },
      create: { key: 'security.passwordRequireUpperLowerDigit', value: String(passwordRequireUpperLowerDigit), category: 'security', updatedBy: requester.id },
    });
    await this.prisma.systemSetting.upsert({
      where: { key: 'security.passwordRequireSpecial' },
      update: { value: String(passwordRequireSpecial), updatedBy: requester.id },
      create: { key: 'security.passwordRequireSpecial', value: String(passwordRequireSpecial), category: 'security', updatedBy: requester.id },
    });

    return this.getPolicy(requester);
  }

  async listSessions(requester: AuthUser, query: any = {}) {
    requireAdmin(requester);
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const targetUserId =
      requester.role === UserRole.SUPERADMIN && query.userId ? parseInt(query.userId, 10) : requester.id;

    const where: any = { userId: targetUserId };
    if (query.status === 'active') where.isRevoked = false;
    if (query.status === 'revoked') where.isRevoked = true;

    const [data, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          ipAddress: true,
          deviceInfo: true,
          createdAt: true,
          expiresAt: true,
          isRevoked: true,
        },
      }),
      this.prisma.session.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async revokeSession(requester: AuthUser, id: number) {
    requireAdmin(requester);
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Sessiya topilmadi');

    const isOwner = session.userId === requester.id;
    const isSuper = requester.role === UserRole.SUPERADMIN;
    if (!isOwner && !isSuper) {
      throw new ForbiddenException("Ruxsat yo'q");
    }

    await this.prisma.session.update({
      where: { id },
      data: { isRevoked: true },
    });

    return { message: 'Sessiya yopildi' };
  }

  async logoutAll(requester: AuthUser, body: any) {
    requireAdmin(requester);
    const targetUserId =
      requester.role === UserRole.SUPERADMIN && body?.userId ? parseInt(body.userId, 10) : requester.id;

    await this.prisma.session.updateMany({
      where: { userId: targetUserId, isRevoked: false },
      data: { isRevoked: true },
    });

    return { message: 'Barcha sessiyalar yopildi' };
  }

  async listSecurityLogs(requester: AuthUser, query: any = {}) {
    requireAdmin(requester);
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (requester.role !== UserRole.SUPERADMIN) {
      where.userId = requester.id;
    } else if (query.userId) {
      where.userId = parseInt(query.userId, 10);
    }

    if (query.event) where.event = query.event;
    if (query.success === 'true') where.success = true;
    if (query.success === 'false') where.success = false;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }
    if (query.search) {
      where.OR = [
        { event: { contains: query.search, mode: 'insensitive' } },
        { ipAddress: { contains: query.search, mode: 'insensitive' } },
        { userAgent: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.securityLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.securityLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getSecurityLog(requester: AuthUser, id: number) {
    requireAdmin(requester);
    const log = await this.prisma.securityLog.findUnique({
      where: { id },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
    });
    if (!log) throw new NotFoundException('Log topilmadi');
    if (requester.role !== UserRole.SUPERADMIN && log.userId !== requester.id) {
      throw new ForbiddenException("Ruxsat yo'q");
    }
    return log;
  }
}

