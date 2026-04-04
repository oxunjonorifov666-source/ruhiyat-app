import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

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

  async findAll(query: {
    page?: number; limit?: number; search?: string;
    status?: string; plan?: string;
    sortBy?: string; sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status === 'active') {
      where.center = { isActive: true };
    } else if (query.status === 'inactive') {
      where.center = { isActive: false };
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

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const admin = await this.prisma.administrator.findUnique({
      where: { id },
      select: ADMIN_SELECT,
    });
    if (!admin) throw new NotFoundException('Administrator topilmadi');
    return admin;
  }

  async getStats() {
    const [total, active, inactive, premium] = await Promise.all([
      this.prisma.administrator.count(),
      this.prisma.administrator.count({ where: { center: { isActive: true } } }),
      this.prisma.administrator.count({ where: { center: { isActive: false } } }),
      this.prisma.administrator.count({ where: { center: { subscriptionPlan: 'PREMIUM' } } }),
    ]);
    return { total, active, inactive, premium };
  }

  async create(data: {
    firstName: string; lastName: string; email?: string; phone?: string;
    centerName: string; centerDescription?: string; address?: string;
    centerPhone?: string; centerEmail?: string; position?: string;
    subscriptionPlan?: string; userId?: number;
  }) {
    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

      const existingAdmin = await this.prisma.administrator.findUnique({ where: { userId: data.userId } });
      if (existingAdmin) throw new ConflictException('Bu foydalanuvchi allaqachon administrator');

      return this.prisma.$transaction(async (tx) => {
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

    return this.prisma.$transaction(async (tx) => {
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

  async update(id: number, data: {
    firstName?: string; lastName?: string; position?: string;
    centerName?: string; centerDescription?: string; address?: string;
    centerPhone?: string; centerEmail?: string;
    subscriptionPlan?: string;
  }) {
    const admin = await this.findOne(id);

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
    if (data.subscriptionPlan !== undefined) centerUpdate.subscriptionPlan = data.subscriptionPlan;

    return this.prisma.$transaction(async (tx) => {
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

  async activate(id: number) {
    const admin = await this.findOne(id);
    if (admin.center.isActive) throw new ConflictException('Markaz allaqachon faol');
    await this.prisma.educationCenter.update({
      where: { id: admin.center.id },
      data: { isActive: true },
    });
    return this.findOne(id);
  }

  async deactivate(id: number) {
    const admin = await this.findOne(id);
    if (!admin.center.isActive) throw new ConflictException('Markaz allaqachon nofaol');
    await this.prisma.educationCenter.update({
      where: { id: admin.center.id },
      data: { isActive: false },
    });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.administrator.delete({ where: { id } });
    return { message: "Administrator o'chirildi" };
  }
}
