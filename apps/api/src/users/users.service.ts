import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string; role?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          role: true, isActive: true, isVerified: true, lastLoginAt: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
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
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, isActive: true, isVerified: true, lastLoginAt: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    return user;
  }

  async update(id: number, data: { firstName?: string; lastName?: string; isActive?: boolean; role?: string }, callerRole?: string) {
    await this.findOne(id);
    if ((data.role !== undefined || data.isActive !== undefined) && callerRole !== 'SUPERADMIN') {
      throw new ForbiddenException("Faqat superadmin rol yoki faollik holatini o'zgartira oladi");
    }
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) updateData.role = data.role;
    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        role: true, isActive: true, isVerified: true, createdAt: true, updatedAt: true,
      },
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
