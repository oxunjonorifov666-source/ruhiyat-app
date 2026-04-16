import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('financial')
  @Permissions('system.settings')
  async getFinancialReport(
    @CurrentUser() requester: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Siz ushbu ma\'lumotlarni ko\'rish huquqiga ega emassiz');
    }

    const where: any = {
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    };
    if (status) where.status = status;

    const data = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        payment: { select: { provider: true, providerPaymentId: true } },
      },
    });

    const summary = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      data: data.map(t => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        status: t.status,
        date: t.createdAt,
        userName: t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() || t.user.email : 'Nomalum',
        provider: t.payment?.provider || 'Noma\'lum',
      })),
      summary: {
        totalAmount: summary._sum.amount || 0,
        totalCount: summary._count.id,
      },
    };
  }

  @Get('sessions')
  @Permissions('system.settings')
  async getSessionReport(
    @CurrentUser() requester: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Siz ushbu ma\'lumotlarni ko\'rish huquqiga ega emassiz');
    }

    const where: any = {
      scheduledAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    };
    if (status) where.status = status;

    const data = await this.prisma.bookingSession.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        psychologist: { select: { firstName: true, lastName: true } },
      },
    });

    return data.map(s => ({
      id: s.id,
      scheduledAt: s.scheduledAt,
      duration: s.duration,
      price: s.price,
      status: s.status,
      paymentStatus: s.paymentStatus,
      userName: `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() || s.user.email,
      psychologistName: `${s.psychologist.firstName} ${s.psychologist.lastName}`,
    }));
  }

  @Get('users')
  @Permissions('system.settings')
  async getUserReport(
    @CurrentUser() requester: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('role') role?: UserRole,
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Siz ushbu ma\'lumotlarni ko\'rish huquqiga ega emassiz');
    }

    const where: any = {
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    };
    if (role) where.role = role;

    const [data, counts] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    return {
      data,
      summary: counts.map(c => ({ role: c.role, count: c._count.id })),
    };
  }
}
