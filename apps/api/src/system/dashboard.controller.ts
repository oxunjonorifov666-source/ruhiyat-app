import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('superadmin/stats')
  @Permissions('system.settings')
  async getSuperadminStats() {
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
      const found = usersByMonth.find((r) => r.month === key);
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
      recentActivity: recentAuditLogs.map((log) => ({
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
  async getAdminStats(@CurrentUser() currentUser: { userId: number }) {
    const admin = await this.prisma.administrator.findUnique({
      where: { userId: currentUser.userId },
      select: { centerId: true },
    });

    const centerId = admin?.centerId;
    if (!centerId) {
      return { stats: { totalStudents: 0, totalTeachers: 0, totalCourses: 0, totalGroups: 0, totalPsychologists: 0, totalSessions: 0, pendingSessions: 0, completedSessions: 0, totalRevenue: 0, monthlyRevenue: 0 }, sessions: { upcoming: [], recent: [] }, monthlyStudents: [] };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const centerPsychologistIds = await this.prisma.psychologist.findMany({
      where: { centerId },
      select: { id: true },
    });
    const psychologistIds = centerPsychologistIds.map((p) => p.id);

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
    ]);

    const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const monthlyStudents = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = studentsByMonth.find((r) => r.month === key);
      monthlyStudents.push({
        month: monthNames[d.getMonth()],
        count: found ? Number(found.count) : 0,
      });
    }

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
        totalRevenue: sessionRevenue._sum.price || 0,
        monthlyRevenue: monthlySessionRevenue._sum.price || 0,
      },
      sessions: {
        upcoming: upcomingSessions.map((s) => ({
          id: s.id,
          scheduledAt: s.scheduledAt,
          status: s.status,
          duration: s.duration,
          psychologist: `${s.psychologist.firstName} ${s.psychologist.lastName}`,
          client: s.user.firstName ? `${s.user.firstName} ${s.user.lastName || ''}`.trim() : s.user.email,
        })),
        recent: recentSessions.map((s) => ({
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
