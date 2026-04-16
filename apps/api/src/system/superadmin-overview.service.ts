import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

export type OverviewGranularity = 'day' | 'week' | 'month';

function parseDate(s: string, endOfDay = false): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return new Date();
  if (endOfDay) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

function defaultRange(): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

function previousPeriod(start: Date, end: Date): { prevStart: Date; prevEnd: Date } {
  const ms = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  return { prevStart, prevEnd };
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

@Injectable()
export class SuperadminOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(
    requester: AuthUser,
    dateFrom?: string,
    dateTo?: string,
    granularity: OverviewGranularity = 'day',
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Siz ushbu ma\'lumotlarni ko\'rish huquqiga ega emassiz');
    }

    const g: OverviewGranularity = ['day', 'week', 'month'].includes(granularity)
      ? granularity
      : 'day';

    const { start, end } =
      dateFrom && dateTo
        ? { start: parseDate(dateFrom, false), end: parseDate(dateTo, true) }
        : defaultRange();

    const { prevStart, prevEnd } = previousPeriod(start, end);

    const trunc = g === 'day' ? 'day' : g === 'week' ? 'week' : 'month';

    const activeWindowStart = new Date();
    activeWindowStart.setDate(activeWindowStart.getDate() - 30);
    activeWindowStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      sessionsInRange,
      completedSessionsInRange,
      revenueInRange,
      newUsersInRange,
      prevSessions,
      prevRevenue,
      prevNewUsers,
      usersByRole,
      userBuckets,
      sessionBuckets,
      revenueBuckets,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { lastLoginAt: { gte: activeWindowStart } },
      }),
      this.prisma.bookingSession.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.bookingSession.count({
        where: {
          createdAt: { gte: start, lte: end },
          status: 'COMPLETED',
        },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: start, lte: end },
        },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
      this.prisma.bookingSession.count({
        where: { createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: prevStart, lte: prevEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      this.bucketSeriesUsers(trunc, start, end),
      this.bucketSeriesSessions(trunc, start, end),
      this.bucketSeriesRevenue(trunc, start, end),
    ]);

    const revenue = Number(revenueInRange._sum.amount || 0);
    const prevRev = Number(prevRevenue._sum.amount || 0);

    const series = this.mergeSeries(
      g,
      userBuckets,
      sessionBuckets,
      revenueBuckets,
    );

    const roleLabels: Record<string, string> = {
      SUPERADMIN: 'Superadmin',
      ADMINISTRATOR: 'Administrator',
      MOBILE_USER: 'Mobil foydalanuvchi',
    };

    return {
      range: {
        from: start.toISOString(),
        to: end.toISOString(),
      },
      granularity: g,
      activeUsersWindowDays: 30,
      kpis: {
        totalUsers,
        activeUsers,
        sessions: sessionsInRange,
        completedSessions: completedSessionsInRange,
        revenue,
        newRegistrations: newUsersInRange,
      },
      trends: {
        sessions: pctChange(sessionsInRange, prevSessions),
        revenue: pctChange(revenue, prevRev),
        newUsers: pctChange(newUsersInRange, prevNewUsers),
      },
      usersByRole: usersByRole.map((r) => ({
        role: r.role,
        label: roleLabels[r.role] || r.role,
        count: r._count._all,
      })),
      series,
    };
  }

  private async bucketSeriesUsers(
    trunc: string,
    start: Date,
    end: Date,
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRawUnsafe<{ b: Date; c: bigint }[]>(
      `SELECT date_trunc($1::text, "created_at") AS b, COUNT(*)::bigint AS c
       FROM users
       WHERE "created_at" >= $2 AND "created_at" <= $3
       GROUP BY 1 ORDER BY 1`,
      trunc,
      start,
      end,
    );
    return this.rowsToMap(rows);
  }

  private async bucketSeriesSessions(
    trunc: string,
    start: Date,
    end: Date,
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRawUnsafe<{ b: Date; c: bigint }[]>(
      `SELECT date_trunc($1::text, "created_at") AS b, COUNT(*)::bigint AS c
       FROM booking_sessions
       WHERE "created_at" >= $2 AND "created_at" <= $3
       GROUP BY 1 ORDER BY 1`,
      trunc,
      start,
      end,
    );
    return this.rowsToMap(rows);
  }

  private async bucketSeriesRevenue(
    trunc: string,
    start: Date,
    end: Date,
  ): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRawUnsafe<{ b: Date; c: number }[]>(
      `SELECT date_trunc($1::text, "created_at") AS b,
              COALESCE(SUM(amount), 0)::float AS c
       FROM payments
       WHERE status = 'COMPLETED'
         AND "created_at" >= $2 AND "created_at" <= $3
       GROUP BY 1 ORDER BY 1`,
      trunc,
      start,
      end,
    );
    return this.rowsToMap(rows);
  }

  private rowsToMap(rows: { b: Date; c: bigint | number }[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = new Date(row.b).toISOString();
      map.set(key, Number(row.c));
    }
    return map;
  }

  private mergeSeries(
    g: OverviewGranularity,
    users: Map<string, number>,
    sessions: Map<string, number>,
    revenue: Map<string, number>,
  ) {
    const keys = new Set<string>([
      ...users.keys(),
      ...sessions.keys(),
      ...revenue.keys(),
    ]);
    const sorted = Array.from(keys).sort();
    return sorted.map((iso) => {
      const d = new Date(iso);
      const label = this.formatLabel(d, g);
      return {
        key: iso,
        label,
        newUsers: users.get(iso) || 0,
        sessions: sessions.get(iso) || 0,
        revenue: revenue.get(iso) || 0,
      };
    });
  }

  private formatLabel(d: Date, g: OverviewGranularity): string {
    if (g === 'day') {
      return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' });
    }
    if (g === 'week') {
      return (
        'Hafta ' +
        d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })
      );
    }
    return d.toLocaleDateString('uz-UZ', { month: 'short', year: 'numeric' });
  }
}
