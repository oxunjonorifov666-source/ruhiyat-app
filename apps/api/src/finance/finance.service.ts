import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { MonetizationService } from '../monetization/monetization.service';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly monetization: MonetizationService,
  ) {}

  private enforceFinanceIsolation(where: any, requester: AuthUser, explicitCenterId?: number) {
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

  private async getCenterBookingSessionWhere(centerId: number) {
    const centerPsychologists = await this.prisma.psychologist.findMany({
      where: { centerId },
      select: { id: true },
    });
    const psychologistIds = centerPsychologists.map((p) => p.id);
    if (psychologistIds.length === 0) return { id: -1 };
    return { psychologistId: { in: psychologistIds } };
  }

  async getStats(requester: AuthUser, centerId?: number) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const centerWhere: any = {};
    this.enforceFinanceIsolation(centerWhere, requester, centerId);
    const bookingSessionWhere = centerWhere.centerId
      ? await this.getCenterBookingSessionWhere(centerWhere.centerId)
      : { id: -1 };

    const [
      coursePaymentsTotal,
      coursePaymentsPaid,
      coursePaymentsFailed,
      coursePaymentsRevenueAgg,
      courseMonthlyRevenueAgg,
      courseLastMonthRevenueAgg,
      sessionsTotal,
      sessionsPaid,
      sessionsRefunded,
      sessionRevenueAgg,
      sessionMonthlyRevenueAgg,
      sessionLastMonthRevenueAgg,
    ] = await Promise.all([
      // Course / education center payments (center_payments)
      this.prisma.centerPayment.count({ where: centerWhere }),
      this.prisma.centerPayment.count({ where: { ...centerWhere, status: 'PAID' } }),
      this.prisma.centerPayment.count({ where: { ...centerWhere, status: 'FAILED' } }),
      this.prisma.centerPayment.aggregate({ where: { ...centerWhere, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.centerPayment.aggregate({
        where: { ...centerWhere, status: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.centerPayment.aggregate({
        where: { ...centerWhere, status: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
      // Psychologist sessions (booking_sessions)
      this.prisma.bookingSession.count({ where: bookingSessionWhere }),
      this.prisma.bookingSession.count({ where: { ...bookingSessionWhere, paymentStatus: 'PAID' } }),
      this.prisma.bookingSession.count({ where: { ...bookingSessionWhere, paymentStatus: 'REFUNDED' } }),
      this.prisma.bookingSession.aggregate({ where: { ...bookingSessionWhere, paymentStatus: 'PAID' }, _sum: { price: true } }),
      this.prisma.bookingSession.aggregate({
        where: { ...bookingSessionWhere, paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { price: true },
      }),
      this.prisma.bookingSession.aggregate({
        where: { ...bookingSessionWhere, paymentStatus: 'PAID', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { price: true },
      }),
    ]);

    const totalRevenue = (coursePaymentsRevenueAgg._sum.amount || 0) + Number(sessionRevenueAgg._sum.price || 0);
    const monthlyRevenue = (courseMonthlyRevenueAgg._sum.amount || 0) + Number(sessionMonthlyRevenueAgg._sum.price || 0);
    const lastMonthRevenue = (courseLastMonthRevenueAgg._sum.amount || 0) + Number(sessionLastMonthRevenueAgg._sum.price || 0);

    return {
      totalPayments: coursePaymentsTotal,
      completedPayments: coursePaymentsPaid,
      failedPayments: coursePaymentsFailed,
      refundedPayments: sessionsRefunded,
      totalTransactions: sessionsTotal,
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
    };
  }

  async getMonthlyRevenue(requester: AuthUser, centerId?: number) {
    const now = new Date();
    const months = [];
    const whereBase: any = {};
    this.enforceFinanceIsolation(whereBase, requester, centerId);
    const bookingSessionWhereBase = whereBase.centerId
      ? await this.getCenterBookingSessionWhere(whereBase.centerId)
      : { id: -1 };

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = start.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short' });

      const [
        courseRevenueAgg,
        coursePaymentsCount,
        sessionRevenueAgg,
        sessionPaymentsCount,
        sessionRefundsCount,
      ] = await Promise.all([
        this.prisma.centerPayment.aggregate({
          where: { ...whereBase, status: 'PAID', createdAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.centerPayment.count({
          where: { ...whereBase, status: 'PAID', createdAt: { gte: start, lte: end } },
        }),
        this.prisma.bookingSession.aggregate({
          where: { ...bookingSessionWhereBase, paymentStatus: 'PAID', createdAt: { gte: start, lte: end } },
          _sum: { price: true },
        }),
        this.prisma.bookingSession.count({
          where: { ...bookingSessionWhereBase, paymentStatus: 'PAID', createdAt: { gte: start, lte: end } },
        }),
        this.prisma.bookingSession.count({
          where: { ...bookingSessionWhereBase, paymentStatus: 'REFUNDED', createdAt: { gte: start, lte: end } },
        }),
      ]);

      months.push({
        month: monthLabel,
        revenue: (courseRevenueAgg._sum.amount || 0) + Number(sessionRevenueAgg._sum.price || 0),
        payments: coursePaymentsCount + sessionPaymentsCount,
        refunds: sessionRefundsCount,
      });
    }

    return months;
  }

  async getTransactionsByType(requester: AuthUser, centerId?: number) {
    const centerWhere: any = {};
    this.enforceFinanceIsolation(centerWhere, requester, centerId);
    const bookingSessionWhere = centerWhere.centerId
      ? await this.getCenterBookingSessionWhere(centerWhere.centerId)
      : { id: -1 };

    const [courseAgg, courseCount, sessionAgg, sessionCount] = await Promise.all([
      this.prisma.centerPayment.aggregate({ where: { ...centerWhere, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.centerPayment.count({ where: { ...centerWhere, status: 'PAID' } }),
      this.prisma.bookingSession.aggregate({ where: { ...bookingSessionWhere, paymentStatus: 'PAID' }, _sum: { price: true } }),
      this.prisma.bookingSession.count({ where: { ...bookingSessionWhere, paymentStatus: 'PAID' } }),
    ]);

    const res: Array<{ type: string; count: number; total: number }> = [];
    if (courseCount > 0) res.push({ type: 'COURSE_PAYMENTS', count: courseCount, total: courseAgg._sum.amount || 0 });
    if (sessionCount > 0) res.push({ type: 'SESSIONS', count: sessionCount, total: Number(sessionAgg._sum.price || 0) });
    return res;
  }

  async getLedger(requester: AuthUser, query: any = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    // Ledger = psychologist session payments for this center (real DB: booking_sessions)
    const centerId = query.centerId ? parseInt(query.centerId as any) : undefined;
    const isolationProbe: any = {};
    this.enforceFinanceIsolation(isolationProbe, requester, centerId);
    const bookingWhereBase = isolationProbe.centerId
      ? await this.getCenterBookingSessionWhere(isolationProbe.centerId)
      : { id: -1 };

    const where: any = { ...bookingWhereBase };
    if (query.search) {
      where.OR = [
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { psychologist: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { psychologist: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status) where.paymentStatus = query.status;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }

    const [rows, total] = await Promise.all([
      this.prisma.bookingSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          price: true,
          createdAt: true,
          scheduledAt: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          psychologist: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.bookingSession.count({ where }),
    ]);

    const data = rows.map((r: any) => ({
      id: r.id,
      type: 'SESSION',
      status: r.paymentStatus,
      amount: Number(r.price || 0),
      currency: 'UZS',
      description: `Seans: ${r.psychologist?.firstName || ''} ${r.psychologist?.lastName || ''}`.trim(),
      createdAt: r.createdAt,
      user: r.user,
      psychologist: r.psychologist,
      scheduledAt: r.scheduledAt,
      sessionStatus: r.status,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllPayments(requester: AuthUser, query: any = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const centerId = query.centerId ? parseInt(query.centerId as any) : undefined;
    this.enforceFinanceIsolation(where, requester, centerId);

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { phone: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { 
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          center: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPayment(requester: AuthUser, id: number, centerId?: number) {
    const where: any = { id };
    this.enforceFinanceIsolation(where, requester, centerId);

    const p = await this.prisma.payment.findFirst({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, phone: true } },
        center: { select: { id: true, name: true } },
        transactions: true,
      },
    });
    if (!p) throw new NotFoundException("To'lov topilmadi");
    return p;
  }

  async createPayment(requester: AuthUser, data: any) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN ? data.centerId : requester.centerId;
    if (!targetCenterId) {
      throw new ForbiddenException('Markaz ID ko\'rsatilmadi');
    }

    return this.prisma.payment.create({
      data: {
        ...data,
        centerId: targetCenterId,
        amount: parseFloat(data.amount as any),
        userId: data.userId ? parseInt(data.userId as any) : null,
      }
    });
  }

  async updatePaymentStatus(
    requester: AuthUser,
    id: number,
    body: { status: PaymentStatus },
    centerId?: number,
  ) {
    await this.findPayment(requester, id, centerId);
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: body.status },
    });
    if (body.status === PaymentStatus.COMPLETED) {
      await this.monetization.applyPlatformFeeOnPaymentCompleted(id);
    }
    return updated;
  }

  async findAllTransactions(requester: AuthUser, query: any = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const centerId = query.centerId ? parseInt(query.centerId as any) : undefined;
    this.enforceFinanceIsolation(where, requester, centerId);

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { referenceId: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { 
          user: { select: { id: true, firstName: true, lastName: true } },
          center: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllRevenue(requester: AuthUser, query: any = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    const centerId = query.centerId ? parseInt(query.centerId as any) : undefined;
    this.enforceFinanceIsolation(where, requester, centerId);
    if (query.source) where.source = query.source;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
    }

    const [data, total] = await Promise.all([
      this.prisma.revenueRecord.findMany({ 
        where, 
        orderBy: { createdAt: 'desc' }, 
        skip, 
        take: limit 
      }),
      this.prisma.revenueRecord.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
