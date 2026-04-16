import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { CenterPaymentStatus, PaymentMethod } from '@prisma/client';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private enforceCenterIsolation(where: any, requester: AuthUser, explicitCenterId?: number) {
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

  async create(requester: AuthUser, centerId: number, data: CreatePaymentDto) {
    this.enforceCenterIsolation({}, requester, centerId);

    const student = await this.prisma.student.findUnique({
      where: { id: data.studentId },
    });
    if (!student || student.centerId !== centerId) {
      throw new ForbiddenException('Student does not belong to this center');
    }

    if (data.enrollmentId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id: data.enrollmentId },
        include: { student: true }
      });
      if (!enrollment || enrollment.student.centerId !== centerId) {
        throw new ForbiddenException('Enrollment does not belong to this center');
      }
    }

    return this.prisma.centerPayment.create({
      data: {
        amount: data.amount,
        currency: data.currency || "UZS",
        status: (data.status as CenterPaymentStatus) || CenterPaymentStatus.PENDING,
        method: (data.method as PaymentMethod) || PaymentMethod.CASH,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        student: { connect: { id: data.studentId } },
        center: { connect: { id: centerId } },
        enrollment: data.enrollmentId ? { connect: { id: data.enrollmentId } } : undefined,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
        enrollment: { include: { course: { select: { name: true } }, group: { select: { name: true } } } }
      }
    });
  }

  async findAll(requester: AuthUser, params: {
    page?: number;
    limit?: number;
    centerId?: number;
    studentId?: number;
    enrollmentId?: number;
    status?: string;
  }) {
    const { page = 1, limit = 20, centerId, studentId, enrollmentId, status } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);
    
    if (studentId) where.studentId = studentId;
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.centerPayment.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, phone: true } },
          enrollment: { include: { course: { select: { name: true } }, group: { select: { name: true } } } }
        }
      }),
      this.prisma.centerPayment.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number, centerId: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const payment = await this.prisma.centerPayment.findFirst({
      where,
      include: {
        student: true,
        enrollment: { include: { course: true, group: true } }
      }
    });

    if (!payment) throw new NotFoundException('To\'lov topilmadi');
    return payment;
  }

  async update(requester: AuthUser, id: number, centerId: number, data: UpdatePaymentDto) {
    await this.findOne(requester, id, centerId);

    const updateData: any = {};
    if (data.status) updateData.status = data.status as CenterPaymentStatus;
    if (data.method) updateData.method = data.method as PaymentMethod;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.paymentDate) updateData.paymentDate = new Date(data.paymentDate);

    return this.prisma.centerPayment.update({
      where: { id },
      data: updateData,
    });
  }

  async getAnalytics(requester: AuthUser, centerId?: number) {
    const where: any = { status: 'PAID' };
    this.enforceCenterIsolation(where, requester, centerId);

    const payments = await this.prisma.centerPayment.findMany({
      where,
      include: {
        enrollment: { include: { course: true, group: true } }
      }
    });

    let totalRevenue = 0;
    const courseRevenue = new Map<string, number>();
    const groupRevenue = new Map<string, number>();

    payments.forEach((p: any) => {
      totalRevenue += p.amount;

      if (p.enrollment?.course) {
        const cName = p.enrollment.course.name;
        courseRevenue.set(cName, (courseRevenue.get(cName) || 0) + p.amount);
      }

      if (p.enrollment?.group) {
        const gName = p.enrollment.group.name;
        groupRevenue.set(gName, (groupRevenue.get(gName) || 0) + p.amount);
      }
    });

    return {
      totalRevenue,
      revenuePerCourse: Array.from(courseRevenue.entries()).map(([name, value]) => ({ name, value })),
      revenuePerGroup: Array.from(groupRevenue.entries()).map(([name, value]) => ({ name, value })),
    };
  }
}
