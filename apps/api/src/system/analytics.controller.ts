import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class AnalyticsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @Permissions('system.settings')
  async getDashboardStats(@CurrentUser() requester: AuthUser, @Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Siz ushbu ma\'lumotlarni ko\'rish huquqiga ega emassiz');
    }

    // Current period
    const start = dateFrom ? new Date(dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = dateTo ? new Date(dateTo) : new Date();
    end.setHours(23, 59, 59, 999);

    // Calculate duration for previous period comparison
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = new Date(start.getTime() - 1);

    const [
      // Current Period Stats
      currUsersCount,
      currSessionsCount,
      currCompletedSessions,
      currTotalRevenue,
      currCompletedPayments,
      currTestResults,
      currActiveTrainings,
      
      // Previous Period Stats (for trends)
      prevUsersCount,
      prevSessionsCount,
      prevCompletedSessions,
      prevTotalRevenue,
      prevCompletedPayments,
      prevTestResults,
      prevActiveTrainings,

      // Global Stats (not bound by filter for summary)
      totalUsers,
      activeUsers,
      totalPsychs,
      approvedPsychs,
      todaySessions,
      upcomingMeetings,
      
      // Chart Data
      monthlyRevenue,

      // New Enhanced Metrics
      genderDist,
      topPsychs,
      topTests,
    ] = await Promise.all([
      // Current
      this.prisma.user.count({ where: { role: UserRole.MOBILE_USER, createdAt: { gte: start, lte: end } } }),
      this.prisma.bookingSession.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.bookingSession.count({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
      this.prisma.payment.count({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
      this.prisma.testResult.count({ where: { createdAt: { gte: start, lte: end } } }),
      this.prisma.training.count({ where: { isPublished: true, createdAt: { gte: start, lte: end } } }),

      // Previous
      this.prisma.user.count({ where: { role: UserRole.MOBILE_USER, createdAt: { gte: prevStart, lte: prevEnd } } }),
      this.prisma.bookingSession.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
      this.prisma.bookingSession.count({ where: { status: 'COMPLETED', createdAt: { gte: prevStart, lte: prevEnd } } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED', createdAt: { gte: prevStart, lte: prevEnd } } }),
      this.prisma.payment.count({ where: { status: 'COMPLETED', createdAt: { gte: prevStart, lte: prevEnd } } }),
      this.prisma.testResult.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
      this.prisma.training.count({ where: { isPublished: true, createdAt: { gte: prevStart, lte: prevEnd } } }),

      // Global
      this.prisma.user.count({ where: { role: UserRole.MOBILE_USER } }),
      this.prisma.user.count({ where: { role: UserRole.MOBILE_USER, isBlocked: false, isActive: true } }),
      this.prisma.psychologist.count(),
      this.prisma.psychologist.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.bookingSession.count({ where: { scheduledAt: { gte: new Date(new Date().setHours(0,0,0,0)), lte: new Date(new Date().setHours(23,59,59,999)) } } }),
      this.prisma.meeting.count({ where: { status: 'SCHEDULED', scheduledAt: { gte: new Date() } } }),

      // Chart
      this.prisma.$queryRaw`
        SELECT 
          to_char(months.month, 'YYYY-MM') as month, 
          COALESCE(SUM(p.amount), 0)::float as revenue, 
          COUNT(p.id)::int as payments,
          (SELECT COUNT(id)::int FROM transactions WHERE type = 'REFUND' AND status = 'COMPLETED' AND to_char(created_at, 'YYYY-MM') = to_char(months.month, 'YYYY-MM')) as refunds
        FROM (
          SELECT generate_series(
            date_trunc('month', (current_date - interval '11 months')),
            date_trunc('month', current_date),
            interval '1 month'
          ) as month
        ) months
        LEFT JOIN payments p ON date_trunc('month', p.created_at) = months.month AND p.status = 'COMPLETED'
        GROUP BY months.month
        ORDER BY months.month ASC
      `,

      // Demographics
      this.prisma.mobileUser.groupBy({
        by: ['gender'],
        _count: { _all: true },
        where: { gender: { not: null } }
      }),

      // Top Psychologists
      this.prisma.psychologist.findMany({
        take: 5,
        orderBy: { totalSessions: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          totalSessions: true,
          rating: true,
          specialization: true,
        }
      }),

      // Top Tests
      this.prisma.test.findMany({
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          _count: { select: { testResults: true } }
        },
        orderBy: {
          testResults: { _count: 'desc' }
        }
      })
    ]);

    const calculateTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      users: { 
        total: totalUsers, 
        active: activeUsers, 
        periodNew: currUsersCount,
        trend: calculateTrend(currUsersCount, prevUsersCount)
      },
      sessions: {
        total: currSessionsCount,
        completed: currCompletedSessions,
        today: todaySessions,
        trend: calculateTrend(currSessionsCount, prevSessionsCount),
        completedTrend: calculateTrend(currCompletedSessions, prevCompletedSessions)
      },
      finance: {
        totalRevenue: currTotalRevenue._sum.amount || 0,
        completedPayments: currCompletedPayments,
        trend: calculateTrend(currTotalRevenue._sum.amount || 0, prevTotalRevenue._sum.amount || 0),
        paymentsTrend: calculateTrend(currCompletedPayments, prevCompletedPayments)
      },
      psychologists: { 
        total: totalPsychs, 
        approved: approvedPsychs,
        topPerformers: topPsychs
      },
      tests: {
        totalResults: currTestResults,
        trend: calculateTrend(currTestResults, prevTestResults),
        popular: topTests.map(t => ({
          id: t.id,
          title: t.title,
          category: t.category,
          count: t._count.testResults
        }))
      },
      trainings: {
        active: currActiveTrainings,
        trend: calculateTrend(currActiveTrainings, prevActiveTrainings)
      },
      meetings: {
        upcoming: upcomingMeetings
      },
      demographics: {
        gender: genderDist.map(g => ({
          label: g.gender === 'MALE' ? 'Erkak' : g.gender === 'FEMALE' ? 'Ayol' : g.gender,
          count: g._count._all
        }))
      },
      monthlyData: Array.isArray(monthlyRevenue) ? monthlyRevenue : []
    };
  }
}
