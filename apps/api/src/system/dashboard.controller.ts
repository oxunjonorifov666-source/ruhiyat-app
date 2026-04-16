import { Controller, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { SuperadminOverviewService } from './superadmin-overview.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class DashboardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly superadminOverview: SuperadminOverviewService,
  ) {}

  @Get('superadmin/overview')
  @Permissions('system.settings')
  getSuperadminOverview(
    @CurrentUser() requester: AuthUser,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.superadminOverview.getOverview(
      requester,
      dateFrom,
      dateTo,
      granularity as 'day' | 'week' | 'month' | undefined,
    );
  }

  @Get('superadmin/stats')
  @Permissions('system.settings')
  async getSuperadminStats(@CurrentUser() requester: AuthUser) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Siz ushbu ma\'lumotlarni ko\'rish huquqiga ega emassiz');
    }

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalUsers,
      activePsychologists,
      educationCenters,
      totalPayments,
      activeSessions,
      communityPosts,
      articles,
      recentUsers,
      pendingBookings,
      completedBookings,
      totalBookings,
      bookingRevenue,
      recentAuditLogs,
      usersByMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.psychologist.count({ where: { isAvailable: true } }),
      this.prisma.educationCenter.count(),
      this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
      this.prisma.session.count({ where: { isRevoked: false } }),
      this.prisma.communityPost.count(),
      this.prisma.article.count({ where: { isPublished: true } }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, createdAt: true },
      }),
      this.prisma.bookingSession.count({ where: { status: 'PENDING' } }),
      this.prisma.bookingSession.count({ where: { status: 'COMPLETED' } }),
      this.prisma.bookingSession.count(),
      this.prisma.bookingSession.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { price: true } }),
      this.prisma.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM users
        WHERE created_at >= ${sixMonthsAgo}
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,
    ]);

    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = usersByMonth.find((r: any) => r.month === key);
      monthlyGrowth.push({
        month: monthNames[d.getMonth()],
        count: found ? Number(found.count) : 0,
      });
    }

    return {
      stats: {
        totalUsers,
        activePsychologists,
        educationCenters,
        totalPayments,
        activeSessions,
        communityPosts,
        articles,
      },
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        completed: completedBookings,
        revenue: bookingRevenue._sum.price || 0,
      },
      recentUsers,
      monthlyGrowth,
      recentActivity: recentAuditLogs.map((log: any) => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        userName: log.user
          ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
          : 'Tizim',
        createdAt: log.createdAt,
      })),
    };
  }

  @Get('admin/stats')
  @Permissions('centers.read')
  async getAdminStats(
    @CurrentUser() requester: AuthUser,
    @Query('centerId') explicitCenterId?: string,
  ) {
    const centerId = requester.role === UserRole.SUPERADMIN 
      ? (explicitCenterId ? parseInt(explicitCenterId) : null)
      : requester.centerId;
    
    if (!centerId) {
      if (requester.role === UserRole.SUPERADMIN && !explicitCenterId) {
        throw new ForbiddenException('Superadmin uchun markaz ID ko\'rsatilmadi');
      }
      return { stats: { totalStudents: 0 }, sessions: { upcoming: [], recent: [] }, monthlyStudents: [] };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const centerPsychologistIds = await this.prisma.psychologist.findMany({
      where: { centerId },
      select: { id: true },
    });
    const psychologistIds = centerPsychologistIds.map((p: any) => p.id);

    const sessionWhere = psychologistIds.length > 0
      ? { psychologistId: { in: psychologistIds } }
      : { id: -1 };

    const [
      totalStudents,
      totalTeachers,
      totalCourses,
      totalGroups,
      totalPsychologists,
      totalSessions,
      pendingSessions,
      completedSessions,
      sessionRevenue,
      monthlySessionRevenue,
      upcomingSessions,
      recentSessions,
      studentsByMonth,
      activeEnrollments,
      completedEnrollments,
      totalEnrollments,
      totalTests,
      completedTests,
    ] = await Promise.all([
      this.prisma.student.count({ where: { centerId } }),
      this.prisma.teacher.count({ where: { centerId } }),
      this.prisma.course.count({ where: { centerId } }),
      this.prisma.group.count({ where: { course: { centerId } } }),
      this.prisma.psychologist.count({ where: { centerId } }),
      this.prisma.bookingSession.count({ where: sessionWhere }),
      this.prisma.bookingSession.count({ where: { ...sessionWhere, status: 'PENDING' } }),
      this.prisma.bookingSession.count({ where: { ...sessionWhere, status: 'COMPLETED' } }),
      this.prisma.bookingSession.aggregate({
        where: { ...sessionWhere, paymentStatus: 'PAID' },
        _sum: { price: true },
      }),
      this.prisma.bookingSession.aggregate({
        where: { ...sessionWhere, paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
        _sum: { price: true },
      }),
      this.prisma.bookingSession.findMany({
        where: { ...sessionWhere, status: { in: ['PENDING', 'ACCEPTED'] }, scheduledAt: { gte: now } },
        take: 5,
        orderBy: { scheduledAt: 'asc' },
        include: {
          psychologist: { select: { firstName: true, lastName: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.bookingSession.findMany({
        where: sessionWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          psychologist: { select: { firstName: true, lastName: true } },
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT to_char(created_at, 'YYYY-MM') as month, COUNT(*)::bigint as count
        FROM students
        WHERE center_id = ${centerId} AND created_at >= ${sixMonthsAgo}
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY month ASC
      `,
      this.prisma.enrollment.count({ where: { student: { centerId }, status: 'active' } }),
      this.prisma.enrollment.count({ where: { student: { centerId }, status: 'completed' } }),
      this.prisma.enrollment.count({ where: { student: { centerId } } }),
      // Fix: Count tests taken by users who have or had sessions with this center's psychologists
      this.prisma.testResult.count({
        where: {
          user: {
            bookingSessions: {
              some: { psychologistId: { in: psychologistIds } }
            }
          }
        }
      }),
      this.prisma.testResult.count({
        where: {
          user: {
            bookingSessions: {
              some: { psychologistId: { in: psychologistIds } }
            }
          },
          score: { gte: 50 }
        }
      }),
    ]);

    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const monthlyStudents = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = studentsByMonth.find((r: any) => r.month === key);
      monthlyStudents.push({
        month: monthNames[d.getMonth()],
        count: found ? Number(found.count) : 0,
      });
    }

    // KPI Calculations (Real logic)
    // 1. Psychologist Load: Average sessions per psychologist per month (Target: 40)
    const psychologistLoad = totalPsychologists > 0 ? Math.round((completedSessions / (totalPsychologists * 40)) * 100) : 0;
    
    // 2. Group Occupancy: Students per group relative to average capacity (Target: 15)
    const groupOccupancy = totalGroups > 0 ? Math.round((activeEnrollments / (totalGroups * 15)) * 100) : 0;
    
    // 3. Test Success: Positive results relative to total tests
    const testSuccessRate = totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0;

    return {
      stats: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalGroups,
        totalPsychologists,
        totalSessions,
        pendingSessions,
        completedSessions,
        totalRevenue: Number(sessionRevenue._sum.price || 0),
        monthlyRevenue: Number(monthlySessionRevenue._sum.price || 0),
        completionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
        activeEnrollments,
        psychologistLoad: Math.min(psychologistLoad, 100),
        groupOccupancy: Math.min(groupOccupancy, 100),
        testSuccessRate: Math.min(testSuccessRate, 100),
      },
      sessions: {
        upcoming: upcomingSessions.map((s: any) => ({
          id: s.id,
          scheduledAt: s.scheduledAt,
          status: s.status,
          duration: s.duration,
          psychologist: `${s.psychologist.firstName} ${s.psychologist.lastName}`,
          client: s.user.firstName ? `${s.user.firstName} ${s.user.lastName || ''}`.trim() : s.user.email,
        })),
        recent: recentSessions.map((s: any) => ({
          id: s.id,
          scheduledAt: s.scheduledAt,
          status: s.status,
          psychologist: `${s.psychologist.firstName} ${s.psychologist.lastName}`,
          client: s.user.firstName ? `${s.user.firstName} ${s.user.lastName || ''}`.trim() : s.user.email,
          createdAt: s.createdAt,
        })),
      },
      monthlyStudents,
    };
  }
}
