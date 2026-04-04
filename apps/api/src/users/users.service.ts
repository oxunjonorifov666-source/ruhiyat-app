import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

const USER_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  role: true, isActive: true, isBlocked: true, blockedAt: true, blockedReason: true,
  isVerified: true, lastLoginAt: true, createdAt: true, updatedAt: true,
};

const USER_LIST_SELECT = {
  id: true, email: true, phone: true, firstName: true, lastName: true,
  role: true, isActive: true, isBlocked: true, blockedAt: true,
  isVerified: true, lastLoginAt: true, createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number; limit?: number; search?: string;
    role?: string; status?: string; sortBy?: string; sortOrder?: string;
  }) {
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

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
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

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, active, blocked, newUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true, isBlocked: false } }),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return { total, active, blocked, newUsers };
  }

  async create(data: {
    email?: string; phone?: string; password: string;
    firstName?: string; lastName?: string; role: string;
  }) {
    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }
    if (data.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }
    if (!data.email && !data.phone) {
      throw new ConflictException('Email yoki telefon raqam kiritish shart');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email || undefined,
        phone: data.phone || undefined,
        passwordHash,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        role: data.role as any,
        isVerified: true,
      },
      select: USER_SELECT,
    });

    return user;
  }

  async update(
    id: number,
    data: { firstName?: string; lastName?: string; email?: string; phone?: string; isActive?: boolean; role?: string },
    callerRole?: string,
  ) {
    const user = await this.findOne(id);

    if ((data.role !== undefined || data.isActive !== undefined) && callerRole !== 'SUPERADMIN') {
      throw new ForbiddenException("Faqat superadmin rol yoki faollik holatini o'zgartira oladi");
    }

    if (user.role === 'SUPERADMIN' && data.role && data.role !== 'SUPERADMIN') {
      throw new ForbiddenException("Superadmin rolini o'zgartirib bo'lmaydi");
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('Bu email allaqachon ishlatilmoqda');
    }

    if (data.phone && data.phone !== user.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw new ConflictException('Bu telefon raqam allaqachon ishlatilmoqda');
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) updateData.role = data.role;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: USER_SELECT,
    });
  }

  async block(id: number, callerId: number, reason?: string) {
    const user = await this.findOne(id);

    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException("Superadmin foydalanuvchini bloklab bo'lmaydi");
    }
    if (callerId === id) {
      throw new ForbiddenException("O'zingizni bloklay olmaysiz");
    }
    if (user.isBlocked) {
      throw new ConflictException("Foydalanuvchi allaqachon bloklangan");
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: reason || null,
        isActive: false,
      },
      select: USER_SELECT,
    });
  }

  async unblock(id: number) {
    const user = await this.findOne(id);

    if (!user.isBlocked) {
      throw new ConflictException("Foydalanuvchi bloklanmagan");
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        isActive: true,
      },
      select: USER_SELECT,
    });
  }

  async remove(id: number, callerId?: number) {
    const user = await this.findOne(id);
    if (user.role === 'SUPERADMIN') {
      throw new ForbiddenException("Superadmin foydalanuvchini o'chirib bo'lmaydi");
    }
    if (callerId && callerId === id) {
      throw new ForbiddenException("O'zingizni o'chira olmaysiz");
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: "Foydalanuvchi o'chirildi" };
  }

  async getSessions(id: number) {
    return this.prisma.session.findMany({
      where: { userId: id, isRevoked: false },
      orderBy: { createdAt: 'desc' },
    });
  }
}
