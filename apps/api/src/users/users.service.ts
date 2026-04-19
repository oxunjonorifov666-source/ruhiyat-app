import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityObservabilityService } from '../observability/security-observability.service';
import * as bcrypt from 'bcryptjs';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { assertSameCenterOrSuperadmin, resolvePrincipalCenterId } from '../common/tenant-scope.util';

const USER_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  role: true, isActive: true, isBlocked: true, blockedAt: true, blockedReason: true,
  isVerified: true, lastLoginAt: true, createdAt: true, updatedAt: true,
  administrator: { select: { centerId: true, center: { select: { name: true } } } },
  psychologist: { select: { centerId: true, center: { select: { name: true } } } },
};

const USER_LIST_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  role: true, isActive: true, isBlocked: true, blockedAt: true,
  isVerified: true, lastLoginAt: true, createdAt: true,
  administrator: { select: { centerId: true } },
  psychologist: { select: { centerId: true } },
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityObs: SecurityObservabilityService,
  ) {}

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
      /** Superadmin-only filter; non-superadmin `centerId` is taken from the requester. */
      centerId?: number;
    },
    requester: AuthUser,
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.role) where.role = query.role;

    if (query.status === 'active') {
      where.isActive = true;
      where.isBlocked = false;
    } else if (query.status === 'inactive') {
      where.isActive = false;
    } else if (query.status === 'blocked') {
      where.isBlocked = true;
    }

    const isSuperadmin = requester.role === UserRole.SUPERADMIN;
    const targetCenterId = isSuperadmin ? query.centerId : requester.centerId;

    if (!isSuperadmin && requester.centerId == null) {
      throw new ForbiddenException('Markaz tayinlanmagan');
    }

    /** Tenant scope and search must not share one flat OR (would allow cross-tenant search matches). */
    const andParts: any[] = [];

    if (isSuperadmin) {
      if (targetCenterId) {
        const cid =
          typeof targetCenterId === 'number' ? targetCenterId : parseInt(String(targetCenterId), 10);
        if (Number.isFinite(cid)) {
          andParts.push({
            OR: [
              { administrator: { centerId: cid } },
              { psychologist: { centerId: cid } },
            ],
          });
        }
      }
    } else {
      const cid = requester.centerId as number;
      andParts.push({
        OR: [{ administrator: { centerId: cid } }, { psychologist: { centerId: cid } }],
      });
    }

    if (query.search?.trim()) {
      const s = query.search.trim();
      andParts.push({
        OR: [
          { email: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s } },
          { firstName: { contains: s, mode: 'insensitive' } },
          { lastName: { contains: s, mode: 'insensitive' } },
        ],
      });
    }

    if (andParts.length > 0) {
      where.AND = andParts;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: any = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_LIST_SELECT,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Flatten centerId for easier frontend consumption
    const flattenedData = data.map(user => ({
      ...user,
      centerId: resolvePrincipalCenterId(
        user.administrator?.centerId,
        user.psychologist?.centerId,
      ),
    }));

    return { data: flattenedData, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: number, requester: AuthUser) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

    const userCenterId = resolvePrincipalCenterId(
      user.administrator?.centerId,
      user.psychologist?.centerId,
    );

    assertSameCenterOrSuperadmin(
      requester,
      userCenterId,
      'Ushbu foydalanuvchi ma\'lumotlarini ko\'rishga ruxsatingiz yo\'q',
    );

    return {
      ...user,
      centerId: userCenterId,
    };
  }

  async getStats(requester: AuthUser, centerId?: number) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const where: any = {};

    if (requester.role === UserRole.SUPERADMIN) {
      if (centerId) {
        where.OR = [
          { administrator: { centerId: centerId } },
          { psychologist: { centerId: centerId } },
        ];
      }
    } else {
      if (requester.centerId == null) {
        throw new ForbiddenException('Markaz tayinlanmagan');
      }
      const cid = requester.centerId;
      where.OR = [
        { administrator: { centerId: cid } },
        { psychologist: { centerId: cid } },
      ];
    }

    const [total, active, blocked, newUsers] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, isActive: true, isBlocked: false } }),
      this.prisma.user.count({ where: { ...where, isBlocked: true } }),
      this.prisma.user.count({ where: { ...where, createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return { total, active, blocked, newUsers };
  }

  async create(data: {
    email?: string; phone?: string; password: string;
    firstName?: string; lastName?: string; role: string;
    centerId?: number;
  }, requester: AuthUser) {
    let targetCenterId = requester.role === UserRole.SUPERADMIN ? data.centerId : requester.centerId;

    if (requester.role !== UserRole.SUPERADMIN && targetCenterId == null) {
      throw new ForbiddenException("Markaz aniqlanmadi — foydalanuvchi yaratib bo'lmaydi");
    }

    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }
    
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create User and Profile in a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email || undefined,
          phone: data.phone || undefined,
          passwordHash,
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
          role: data.role as any,
          isVerified: true,
        },
      });

      if (data.role === UserRole.ADMINISTRATOR && targetCenterId) {
        await tx.administrator.create({
          data: {
            userId: user.id,
            centerId: targetCenterId as number,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
          }
        });
      } else if (data.role === 'PSYCHOLOGIST' || data.role === 'MOBILE_USER') {
        // Handle other roles similarly if needed...
        // For Phase 1, we focus on Administrator Panel users
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: USER_SELECT,
      });
    });
  }

  async update(
    id: number,
    data: { firstName?: string; lastName?: string; email?: string; phone?: string; isActive?: boolean; role?: string },
    requester: AuthUser,
  ) {
    const user = await this.findOne(id, requester);

    if ((data.role !== undefined || data.isActive !== undefined) && requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat superadmin rol yoki faollik holatini o'zgartira oladi");
    }

    if (user.role === UserRole.SUPERADMIN && data.role && data.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Superadmin rolini o'zgartirib bo'lmaydi");
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) updateData.role = data.role;

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });

    const privilegeFields = ['role', 'isActive'].filter((k) => (data as any)[k] !== undefined);
    if (privilegeFields.length > 0) {
      await this.securityObs.record({
        event: 'USER_PRIVILEGE_OR_STATUS_CHANGED',
        userId: requester.id,
        success: true,
        details: {
          actorRole: requester.role,
          targetUserId: id,
          fields: privilegeFields,
          newRole: data.role ?? undefined,
          newIsActive: data.isActive ?? undefined,
        },
      });
    }

    return updated;
  }

  async block(id: number, reason: string | undefined, requester: AuthUser) {
    const user = await this.findOne(id, requester);

    if (user.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException("Superadmin foydalanuvchini bloklab bo'lmaydi");
    }
    if (requester.id === id) {
      throw new ForbiddenException("O'zingizni bloklay olmaysiz");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason || null,
        isActive: false,
      },
      select: USER_SELECT,
    });

    await this.securityObs.record({
      event: 'USER_BLOCKED',
      userId: requester.id,
      success: true,
      details: {
        actorRole: requester.role,
        targetUserId: id,
        targetRole: user.role,
        hasReason: Boolean(reason?.trim()),
      },
    });

    return updated;
  }

  async unblock(id: number, requester: AuthUser) {
    const user = await this.findOne(id, requester);

    if (!user.isBlocked) {
      throw new ConflictException("Foydalanuvchi bloklanmagan");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        isActive: true,
      },
      select: USER_SELECT,
    });

    await this.securityObs.record({
      event: 'USER_UNBLOCKED',
      userId: requester.id,
      success: true,
      details: {
        actorRole: requester.role,
        targetUserId: id,
        targetRole: user.role,
      },
    });

    return updated;
  }

  async remove(id: number, requester: AuthUser) {
    const user = await this.findOne(id, requester);
    
    if (user.role === UserRole.SUPERADMIN) {
      throw new ForbiddenException("Superadmin foydalanuvchini o'chirib bo'lmaydi");
    }
    if (requester.id === id) {
      throw new ForbiddenException("O'zingizni o'chira olmaysiz");
    }
    
    await this.prisma.user.delete({ where: { id } });
    await this.securityObs.record({
      event: 'USER_DELETED',
      userId: requester.id,
      success: true,
      details: {
        actorRole: requester.role,
        targetUserId: id,
        targetRole: user.role,
      },
    });
    return { success: true, message: "Foydalanuvchi o'chirildi" };
  }

  async getSessions(id: number, requester: AuthUser) {
    await this.findOne(id, requester);
    
    return this.prisma.session.findMany({
      where: { userId: id, isRevoked: false },
      orderBy: { createdAt: 'desc' },
    });
  }
}
