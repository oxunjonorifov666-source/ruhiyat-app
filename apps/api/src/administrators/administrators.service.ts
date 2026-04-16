import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

const ADMIN_SELECT = {
  id: true, userId: true, firstName: true, lastName: true,
  position: true, invitedBy: true, createdAt: true, updatedAt: true,
  user: { select: { id: true, email: true, phone: true, isActive: true, isBlocked: true, role: true } },
  center: {
    select: {
      id: true, name: true, address: true, phone: true, email: true,
      description: true, logoUrl: true, subscriptionPlan: true, isActive: true,
      createdAt: true, updatedAt: true,
      _count: { select: { students: true, teachers: true, courses: true, psychologists: true, staff: true } },
    },
  },
};

const ADMIN_LIST_SELECT = {
  id: true, userId: true, firstName: true, lastName: true,
  position: true, createdAt: true,
  user: { select: { email: true, phone: true, isActive: true } },
  center: {
    select: {
      id: true, name: true, phone: true, subscriptionPlan: true, isActive: true, logoUrl: true,
      _count: { select: { students: true, teachers: true, courses: true } },
    },
  },
};

@Injectable()
export class AdministratorsService {
  constructor(private readonly prisma: PrismaService) {}

  private enforceCenterIsolation(where: any, requester: AuthUser, explicitCenterId?: number) {
    if (requester.role === UserRole.SUPERADMIN) {
      if (explicitCenterId) where.centerId = explicitCenterId;
      return;
    }

    if (requester.centerId === null || requester.centerId === undefined) {
      throw new ForbiddenException('Sizda ushbu ma\'lumotlarga kirish huquqi yo\'q (markaz tayinlanmagan)');
    }

    if (explicitCenterId && explicitCenterId !== requester.centerId) {
      throw new ForbiddenException('Siz faqat o\'zingizning markazingizga tegishli ma\'lumotlarni ko\'rishingiz mumkin');
    }

    where.centerId = requester.centerId;
  }

  async findAll(requester: AuthUser, query: {
    page?: number; limit?: number; search?: string;
    status?: string; plan?: string;
    sortBy?: string; sortOrder?: string;
    centerId?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    this.enforceCenterIsolation(where, requester, query.centerId);

    if (query.status === 'active') {
      where.center = { ...where.center, isActive: true };
    } else if (query.status === 'inactive') {
      where.center = { ...where.center, isActive: false };
    }

    if (query.plan) {
      where.center = { ...where.center, subscriptionPlan: query.plan };
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { center: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: any = sortBy === 'name' ? { firstName: sortOrder } : { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.administrator.findMany({
        where,
        select: ADMIN_LIST_SELECT,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.administrator.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number, centerId?: number) {
    const where: any = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const admin = await this.prisma.administrator.findFirst({
      where,
      select: ADMIN_SELECT,
    });
    if (!admin) throw new NotFoundException('Administrator topilmadi');
    return admin;
  }

  async getStats(requester: AuthUser, centerId?: number) {
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

    const [total, active, inactive, premium] = await Promise.all([
      this.prisma.administrator.count({ where }),
      this.prisma.administrator.count({ where: { ...where, center: { isActive: true } } }),
      this.prisma.administrator.count({ where: { ...where, center: { isActive: false } } }),
      this.prisma.administrator.count({ where: { ...where, center: { subscriptionPlan: 'PREMIUM' } } }),
    ]);
    return { total, active, inactive, premium };
  }

  async create(requester: AuthUser, data: {
    firstName: string; lastName: string; email?: string; phone?: string;
    centerName: string; centerDescription?: string; address?: string;
    centerPhone?: string; centerEmail?: string; position?: string;
    subscriptionPlan?: string; userId?: number;
    centerId?: number;
  }) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat Superadmin yangi markaz va administrator qo'shishi mumkin");
    }

    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

      const existingAdmin = await this.prisma.administrator.findUnique({ where: { userId: data.userId } });
      if (existingAdmin) throw new ConflictException('Bu foydalanuvchi allaqachon administrator');

      return this.prisma.$transaction(async (tx: any) => {
        const center = await tx.educationCenter.create({
          data: {
            name: data.centerName,
            description: data.centerDescription || null,
            address: data.address || null,
            phone: data.centerPhone || null,
            email: data.centerEmail || null,
            subscriptionPlan: (data.subscriptionPlan as any) || 'BASIC',
          },
        });

        await tx.user.update({
          where: { id: data.userId },
          data: { role: 'ADMINISTRATOR' },
        });

        return tx.administrator.create({
          data: {
            userId: data.userId!,
            centerId: center.id,
            firstName: data.firstName,
            lastName: data.lastName,
            position: data.position || null,
          },
          select: ADMIN_SELECT,
        });
      });
    }

    if (!data.email && !data.phone) {
      throw new ConflictException('Email yoki telefon raqam kiritish shart');
    }

    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException("Bu email allaqachon ro'yxatdan o'tgan");
    }
    if (data.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw new ConflictException("Bu telefon raqam allaqachon ro'yxatdan o'tgan");
    }

    const tempPassword = randomBytes(12).toString('base64url');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    return this.prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email || null,
          phone: data.phone || null,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash: hashedPassword,
          role: 'ADMINISTRATOR',
          isVerified: true,
        },
      });

      const center = await tx.educationCenter.create({
        data: {
          name: data.centerName,
          description: data.centerDescription || null,
          address: data.address || null,
          phone: data.centerPhone || null,
          email: data.centerEmail || null,
          subscriptionPlan: (data.subscriptionPlan as any) || 'BASIC',
        },
      });

      return tx.administrator.create({
        data: {
          userId: newUser.id,
          centerId: center.id,
          firstName: data.firstName,
          lastName: data.lastName,
          position: data.position || null,
        },
        select: ADMIN_SELECT,
      });
    });
  }

  async update(requester: AuthUser, id: number, centerId: number, data: any) {
    const admin = await this.findOne(requester, id, centerId);

    const adminUpdate: any = {};
    if (data.firstName !== undefined) adminUpdate.firstName = data.firstName;
    if (data.lastName !== undefined) adminUpdate.lastName = data.lastName;
    if (data.position !== undefined) adminUpdate.position = data.position;

    const centerUpdate: any = {};
    if (data.centerName !== undefined) centerUpdate.name = data.centerName;
    if (data.centerDescription !== undefined) centerUpdate.description = data.centerDescription;
    if (data.address !== undefined) centerUpdate.address = data.address;
    if (data.centerPhone !== undefined) centerUpdate.phone = data.centerPhone;
    if (data.centerEmail !== undefined) centerUpdate.email = data.centerEmail;
    
    if (data.subscriptionPlan !== undefined) {
      if (requester.role !== UserRole.SUPERADMIN) {
        throw new ForbiddenException("Tarifni faqat Superadmin o'zgartirishi mumkin");
      }
      centerUpdate.subscriptionPlan = data.subscriptionPlan;
    }

    return this.prisma.$transaction(async (tx: any) => {
      if (Object.keys(centerUpdate).length > 0) {
        await tx.educationCenter.update({
          where: { id: admin.center.id },
          data: centerUpdate,
        });
      }

      return tx.administrator.update({
        where: { id },
        data: adminUpdate,
        select: ADMIN_SELECT,
      });
    });
  }

  async setStatus(requester: AuthUser, id: number, centerId: number, isActive: boolean) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Statusni faqat Superadmin o'zgartirishi mumkin");
    }
    const admin = await this.findOne(requester, id, centerId);
    await this.prisma.educationCenter.update({
      where: { id: admin.center.id },
      data: { isActive },
    });
    return this.findOne(requester, id, centerId);
  }

  async remove(requester: AuthUser, id: number, centerId: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Administratorni faqat Superadmin o'chirishi mumkin");
    }
    await this.findOne(requester, id, centerId);
    await this.prisma.administrator.delete({ where: { id } });
    return { message: "Administrator o'chirildi" };
  }
}
