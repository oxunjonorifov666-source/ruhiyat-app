import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EducationCentersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.educationCenter.findMany({
        where,
        include: {
          _count: { select: { students: true, teachers: true, courses: true, staff: true, administrators: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.educationCenter.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const center = await this.prisma.educationCenter.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, teachers: true, courses: true, staff: true, administrators: true } },
      },
    });
    if (!center) throw new NotFoundException("Ta'lim markazi topilmadi");
    return center;
  }

  async create(data: any) { return this.prisma.educationCenter.create({ data }); }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.educationCenter.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.educationCenter.delete({ where: { id } });
    return { message: "Ta'lim markazi o'chirildi" };
  }

  async getStaff(centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { centerId };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.staff.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.staff.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getStudents(centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { centerId };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.student.findMany({ where, include: { enrollments: { include: { course: { select: { title: true } } } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.student.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getTeachers(centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { centerId };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.teacher.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getCourses(centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { centerId };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.course.findMany({ where, include: { _count: { select: { groups: true, enrollments: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.course.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getGroups(centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = { centerId };
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    const [data, total] = await Promise.all([
      this.prisma.group.findMany({ where, include: { course: { select: { title: true } }, _count: { select: { enrollments: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.group.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async createStudent(centerId: number, data: any) {
    return this.prisma.student.create({ data: { ...data, centerId } });
  }

  async updateStudent(id: number, data: any) {
    return this.prisma.student.update({ where: { id }, data });
  }

  async createTeacher(centerId: number, data: any) {
    return this.prisma.teacher.create({ data: { ...data, centerId } });
  }

  async createCourse(centerId: number, data: any) {
    return this.prisma.course.create({ data: { ...data, centerId } });
  }

  async createGroup(centerId: number, data: any) {
    return this.prisma.group.create({ data: { ...data, centerId } });
  }
}
