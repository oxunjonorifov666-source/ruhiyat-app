import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { CenterPaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { AuthUser, UserRole } from '@ruhiyat/types';

const ENROLLMENT_LIST_SELECT = {
  id: true,
  studentId: true,
  courseId: true,
  groupId: true,
  status: true,
  enrolledAt: true,
  completedAt: true,
  createdAt: true,
  student: { select: { id: true, firstName: true, lastName: true, phone: true } },
  course: { select: { id: true, name: true } },
  group: { select: { id: true, name: true } },
  payments: { select: { id: true, status: true, amount: true } },
};

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private enforceCenterIsolation(where: any, requester: AuthUser, explicitCenterId?: number) {
    if (requester.role === UserRole.SUPERADMIN) {
      if (explicitCenterId) {
        where.student = { centerId: explicitCenterId };
      }
      return;
    }

    if (requester.centerId === null || requester.centerId === undefined) {
      throw new ForbiddenException('Sizda ushbu ma\'lumotlarga kirish huquqi yo\'q (markaz tayinlanmagan)');
    }

    if (explicitCenterId && explicitCenterId !== requester.centerId) {
      throw new ForbiddenException('Siz faqat o\'zingizning markazingizga tegishli ma\'lumotlarni ko\'rishingiz mumkin');
    }

    where.student = { ...where.student, centerId: requester.centerId };
  }

  async findAll(requester: AuthUser, query: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: number;
    studentId?: number;
    courseId?: number;
    groupId?: number;
    status?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.EnrollmentWhereInput = {};
    this.enforceCenterIsolation(where, requester, query.centerId);

    if (query.studentId) where.studentId = query.studentId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.groupId) where.groupId = query.groupId;
    if (query.status && query.status !== 'all') where.status = query.status;

    if (query.search) {
      where.student = {
        ...((where.student as object) || {}),
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        select: ENROLLMENT_LIST_SELECT as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number, centerId: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where,
      select: ENROLLMENT_LIST_SELECT as any,
    });
    if (!enrollment) throw new NotFoundException("Yozilish topilmadi");
    return enrollment;
  }

  async create(requester: AuthUser, centerId: number, data: CreateEnrollmentDto) {
    this.enforceCenterIsolation({}, requester, centerId);

    if (!data.courseId && !data.groupId) {
      throw new BadRequestException("Kurs yoki guruh ko'rsatilishi shart");
    }

    // Verify student belongs to center
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId, centerId },
    });
    if (!student) throw new BadRequestException("O'quvchi xato kiritildi yoki boshqa markazga tegishli");

    // Verify course belongs to center
    if (data.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: data.courseId, centerId },
      });
      if (!course) throw new BadRequestException("Kurs xato kiritildi yoki boshqa markazga tegishli");
    }

    // Verify group belongs to center and has space
    if (data.groupId) {
      const group = await this.prisma.group.findFirst({
        where: { id: data.groupId, centerId },
        include: { _count: { select: { enrollments: true } } },
      });
      if (!group) throw new BadRequestException("Guruh xato kiritildi yoki boshqa markazga tegishli");

      if (group.maxStudents && group._count.enrollments >= group.maxStudents) {
        throw new ConflictException(`Guruh to'lgan. Maksimal o'quvchilar soni: ${group.maxStudents}`);
      }
    }

    // Check duplicate enrollment
    const existing = await this.prisma.enrollment.findFirst({
      where: {
        studentId: data.studentId,
        courseId: data.courseId ?? null,
        groupId: data.groupId ?? null,
      },
    });
    if (existing) {
      throw new ConflictException("Ushbu o'quvchi bu kurs/guruhga allaqachon yozilgan");
    }

    const enrollment = await this.prisma.enrollment.create({
      data: {
        studentId: data.studentId,
        courseId: data.courseId ?? null,
        groupId: data.groupId ?? null,
        status: data.status ?? "active",
      },
      select: ENROLLMENT_LIST_SELECT as any,
    });

    if (data.requirePayment && data.paymentAmount) {
      await this.prisma.centerPayment.create({
        data: {
          centerId,
          studentId: data.studentId,
          enrollmentId: enrollment.id as any as number,
          amount: data.paymentAmount,
          currency: "UZS",
          status: CenterPaymentStatus.PENDING,
          method: PaymentMethod.CASH,
        }
      });
    }

    return enrollment;
  }

  async update(requester: AuthUser, id: number, centerId: number, data: UpdateEnrollmentDto) {
    await this.findOne(requester, id, centerId);

    if (data.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: data.courseId, centerId },
      });
      if (!course) throw new BadRequestException("Kurs xato kiritildi yoki boshqa markazga tegishli");
    }

    if (data.groupId) {
      const group = await this.prisma.group.findFirst({
        where: { id: data.groupId, centerId },
      });
      if (!group) throw new BadRequestException("Guruh xato kiritildi yoki boshqa markazga tegishli");
    }

    const updateData: Prisma.EnrollmentUpdateInput = {};
    if (data.courseId !== undefined) {
      if (data.courseId === null) updateData.course = { disconnect: true };
      else updateData.course = { connect: { id: data.courseId } };
    }
    if (data.groupId !== undefined) {
      if (data.groupId === null) updateData.group = { disconnect: true };
      else updateData.group = { connect: { id: data.groupId } };
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'completed' && data.completedAt === undefined) {
        updateData.completedAt = new Date();
      }
    }
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt ? new Date(data.completedAt) : null;

    return this.prisma.enrollment.update({
      where: { id },
      data: updateData,
      select: ENROLLMENT_LIST_SELECT as any,
    });
  }

  async remove(requester: AuthUser, id: number, centerId: number) {
    await this.findOne(requester, id, centerId);
    await this.prisma.enrollment.delete({ where: { id } });
    return { message: "Yozilish bekor qilindi" };
  }

  async getAnalytics(requester: AuthUser, centerId: number, courseId?: number, groupId?: number) {
    const where: Prisma.EnrollmentWhereInput = {};
    this.enforceCenterIsolation(where, requester, centerId);

    if (courseId) where.courseId = courseId;
    if (groupId) where.groupId = groupId;

    const enrollments = await this.prisma.enrollment.findMany({
      where,
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
      },
      orderBy: { enrolledAt: 'asc' },
    });

    let active = 0;
    let completed = 0;
    let dropped = 0;

    const timelineMap = new Map<string, { active: number; completed: number; dropped: number }>();

    for (const en of enrollments) {
      if (en.status === 'active') active++;
      if (en.status === 'completed') completed++;
      if (en.status === 'dropped') dropped++;

      const dateKey = en.enrolledAt.toISOString().slice(0, 7); // YYYY-MM
      if (!timelineMap.has(dateKey)) {
        timelineMap.set(dateKey, { active: 0, completed: 0, dropped: 0 });
      }
      
      if (en.status === 'active') timelineMap.get(dateKey)!.active++;
      else if (en.status === 'completed') timelineMap.get(dateKey)!.completed++;
      else timelineMap.get(dateKey)!.dropped++;
    }

    const timeline = Array.from(timelineMap.entries())
      .map(([month, counts]) => ({
        month,
        ...counts,
        total: counts.active + counts.completed + counts.dropped
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      total: enrollments.length,
      active,
      completed,
      dropped,
      completionRate: enrollments.length > 0 ? Math.round((completed / enrollments.length) * 100) : 0,
      timeline,
    };
  }
}
