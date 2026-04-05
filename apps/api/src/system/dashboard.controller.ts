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

    const [totalStudents, totalTeachers, totalCourses, totalGroups] = await Promise.all([
      centerId
        ? this.prisma.student.count({ where: { centerId } })
        : this.prisma.student.count(),
      centerId
        ? this.prisma.teacher.count({ where: { centerId } })
        : this.prisma.teacher.count(),
      centerId
        ? this.prisma.course.count({ where: { centerId } })
        : this.prisma.course.count(),
      centerId
        ? this.prisma.group.count({ where: { course: { centerId } } })
        : this.prisma.group.count(),
    ]);

    return {
      stats: {
        totalStudents,
        totalTeachers,
        totalCourses,
        totalGroups,
      },
    };
  }
}
