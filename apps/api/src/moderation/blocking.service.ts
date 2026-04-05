import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockingService {
  constructor(private readonly prisma: PrismaService) {}

  async findBlocked(query: {
    page?: number;
    limit?: number;
    search?: string;
    targetType?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { isBlocked: true };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
      if (where.isBlocked) {
        where.AND = [{ isBlocked: true }, { OR: where.OR }];
        delete where.OR;
        delete where.isBlocked;
      }
    }

    if (query.targetType === 'user') {
      where.role = 'MOBILE_USER';
    } else if (query.targetType === 'psychologist') {
      where.psychologist = { isNot: null };
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'blockedAt';
    orderBy[sortField] = query.sortOrder || 'desc';

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          isBlocked: true,
          blockedAt: true,
          blockedReason: true,
          psychologist: { select: { id: true, specialization: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getHistory(query: {
    page?: number;
    limit?: number;
    targetType?: string;
    action?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.targetType) where.targetType = query.targetType;
    if (query.action) where.action = query.action;

    const [data, total] = await Promise.all([
      this.prisma.blockHistory.findMany({
        where,
        include: {
          performer: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blockHistory.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async blockUser(id: number, performerId: number, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (user.role === 'SUPERADMIN') throw new ForbiddenException('SUPERADMIN hisobini bloklash mumkin emas');
    if (user.id === performerId) throw new BadRequestException('O\'zingizni bloklash mumkin emas');
    if (user.isBlocked) throw new BadRequestException('Foydalanuvchi allaqachon bloklangan');

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isBlocked: true, blockedAt: new Date(), blockedReason: reason },
      }),
      this.prisma.blockHistory.create({
        data: { targetType: 'user', targetId: id, action: 'block', reason, performedBy: performerId },
      }),
    ]);

    return updated;
  }

  async unblockUser(id: number, performerId: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');
    if (!user.isBlocked) throw new BadRequestException('Foydalanuvchi bloklanmagan');

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isBlocked: false, blockedAt: null, blockedReason: null },
      }),
      this.prisma.blockHistory.create({
        data: { targetType: 'user', targetId: id, action: 'unblock', performedBy: performerId },
      }),
    ]);

    return updated;
  }

  async blockPsychologist(id: number, performerId: number, reason?: string) {
    const psych = await this.prisma.psychologist.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!psych) throw new NotFoundException('Psixolog topilmadi');
    if (psych.user.role === 'SUPERADMIN') throw new ForbiddenException('SUPERADMIN hisobini bloklash mumkin emas');
    if (psych.userId === performerId) throw new BadRequestException('O\'zingizni bloklash mumkin emas');
    if (psych.user.isBlocked) throw new BadRequestException('Psixolog allaqachon bloklangan');

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: psych.userId },
        data: { isBlocked: true, blockedAt: new Date(), blockedReason: reason },
      }),
      this.prisma.blockHistory.create({
        data: { targetType: 'psychologist', targetId: id, action: 'block', reason, performedBy: performerId },
      }),
    ]);

    return updated;
  }

  async unblockPsychologist(id: number, performerId: number) {
    const psych = await this.prisma.psychologist.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!psych) throw new NotFoundException('Psixolog topilmadi');
    if (!psych.user.isBlocked) throw new BadRequestException('Psixolog bloklanmagan');

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: psych.userId },
        data: { isBlocked: false, blockedAt: null, blockedReason: null },
      }),
      this.prisma.blockHistory.create({
        data: { targetType: 'psychologist', targetId: id, action: 'unblock', performedBy: performerId },
      }),
    ]);

    return updated;
  }
}
