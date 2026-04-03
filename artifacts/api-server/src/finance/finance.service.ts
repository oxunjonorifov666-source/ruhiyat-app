import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPayments() { return this.prisma.payment.findMany({ orderBy: { createdAt: 'desc' } }); }

  async createPayment(data: any) { return this.prisma.payment.create({ data }); }

  async findPayment(id: number) {
    const p = await this.prisma.payment.findUnique({ where: { id }, include: { transactions: true } });
    if (!p) throw new NotFoundException('Payment not found');
    return p;
  }

  async findAllTransactions() { return this.prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } }); }

  async findAllRevenue() { return this.prisma.revenueRecord.findMany({ orderBy: { createdAt: 'desc' } }); }
}
