import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const [
      totalPayments,
      completedPayments,
      failedPayments,
      refundedPayments,
      totalTransactions,
      totalRevenueAgg,
      monthlyRevenueAgg,
      lastMonthRevenueAgg,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.payment.count({ where: { status: 'REFUNDED' } }),
      this.prisma.transaction.count(),
      this.prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = totalRevenueAgg._sum.amount || 0;
    const monthlyRevenue = monthlyRevenueAgg._sum.amount || 0;
    const lastMonthRevenue = lastMonthRevenueAgg._sum.amount || 0;

    return {
      totalPayments,
      completedPayments,
      failedPayments,
      refundedPayments,
      totalTransactions,
      totalRevenue,
      monthlyRevenue,
      lastMonthRevenue,
    };
  }

  async getMonthlyRevenue() {
    const months: { month: string; revenue: number; payments: number; refunds: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = start.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short' });

      const [revenueAgg, paymentsCount, refundsCount] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        this.prisma.payment.count({
          where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        }),
        this.prisma.payment.count({
          where: { status: 'REFUNDED', createdAt: { gte: start, lte: end } },
        }),
      ]);

      months.push({
        month: monthLabel,
        revenue: revenueAgg._sum.amount || 0,
        payments: paymentsCount,
        refunds: refundsCount,
      });
    }

    return months;
  }

  async getTransactionsByType() {
    const types = ['PAYMENT', 'REFUND', 'COMMISSION', 'SUBSCRIPTION', 'PAYOUT'];
    const result: { type: string; count: number; total: number }[] = [];

    for (const type of types) {
      const [count, agg] = await Promise.all([
        this.prisma.transaction.count({ where: { type: type as any } }),
        this.prisma.transaction.aggregate({ where: { type: type as any }, _sum: { amount: true } }),
      ]);
      if (count > 0) {
        result.push({ type, count, total: agg._sum.amount || 0 });
      }
    }

    return result;
  }

  async findAllPayments(query: {
    page?: number; limit?: number; search?: string;
    status?: string; method?: string;
    dateFrom?: string; dateTo?: string;
    sortBy?: string; sortOrder?: string;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59');
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    orderBy[sortField] = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createPayment(data: any) {
    return this.prisma.payment.create({
      data,
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
    });
  }

  async findPayment(id: number) {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true } },
        transactions: true,
      },
    });
    if (!p) throw new NotFoundException("To'lov topilmadi");
    return p;
  }

  async findAllTransactions(query: {
    page?: number; limit?: number; search?: string;
    type?: string; status?: string; method?: string;
    dateFrom?: string; dateTo?: string;
    sortBy?: string; sortOrder?: string;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.search) {
      where.OR = [
        { description: { contains: query.search, mode: 'insensitive' } },
        { referenceId: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.method) where.method = query.method;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59');
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    orderBy[sortField] = query.sortOrder === 'asc' ? 'asc' : 'desc';

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findAllRevenue(query: {
    page?: number; limit?: number;
    source?: string; dateFrom?: string; dateTo?: string;
  } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};

    if (query.source) where.source = query.source;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59');
    }

    const [data, total] = await Promise.all([
      this.prisma.revenueRecord.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.revenueRecord.count({ where }),
    ]);
    return { data, total, page, limit };
  }
}
