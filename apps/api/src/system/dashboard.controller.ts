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
    const [
      totalUsers,
      activePsychologists,
      educationCenters,
      totalPayments,
      activeSessions,
      communityPosts,
      articles,
      recentUsers,
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
    ]);

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
      recentUsers,
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
