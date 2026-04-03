import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCourses(query: { page?: number; limit?: number; search?: string; centerId?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.centerId) where.centerId = query.centerId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          center: { select: { id: true, name: true } },
          _count: { select: { groups: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findCourse(id: number) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        center: { select: { id: true, name: true } },
        groups: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    return course;
  }

  async createCourse(data: any) { return this.prisma.course.create({ data }); }
  async updateCourse(id: number, data: any) {
    await this.findCourse(id);
    return this.prisma.course.update({ where: { id }, data });
  }
  async removeCourse(id: number) {
    await this.findCourse(id);
    await this.prisma.course.delete({ where: { id } });
    return { message: "Kurs o'chirildi" };
  }

  async findAllGroups(query: { page?: number; limit?: number; search?: string; centerId?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (query.centerId) where.centerId = query.centerId;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          course: { select: { id: true, title: true } },
          center: { select: { id: true, name: true } },
          _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createGroup(data: any) { return this.prisma.group.create({ data }); }

  async findAllEnrollments(query: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        include: { student: true, course: { select: { title: true } }, group: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count(),
    ]);
    return { data, total, page, limit };
  }

  async createEnrollment(data: any) { return this.prisma.enrollment.create({ data }); }
}
