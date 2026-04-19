import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class EducationCentersService {
  constructor(private readonly prisma: PrismaService) {}

  private enforceCenterIsolation(where: any, requester: AuthUser, explicitCenterId?: number) {
    if (requester.role === UserRole.SUPERADMIN) {
      if (explicitCenterId) where.centerId = explicitCenterId;
      return;
    }

    if (requester.centerId === null || requester.centerId === undefined) {
      throw new ForbiddenException('Sizda ushbu ma\'lumotlarga kirish huquqi yo\'q (markaz tayinlanmagan)');
    }

    // If an ID is provided in the URL/Params, ensure it matches the user's center
    if (explicitCenterId && explicitCenterId !== requester.centerId) {
      throw new ForbiddenException('Siz faqat o\'zingizning markazingizga tegishli ma\'lumotlarni ko\'rishingiz mumkin');
    }

    where.centerId = requester.centerId;
  }

  async findAll(requester: AuthUser, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Only Superadmins can list all centers
    if (requester.role !== UserRole.SUPERADMIN) {
      if (requester.centerId == null) {
        throw new ForbiddenException("Sizga markaz tayinlanmagan — ro'yxatni ko'ra olmaysiz");
      }
      where.id = requester.centerId;
    }

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

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number) {
    if (requester.role !== UserRole.SUPERADMIN && requester.centerId !== id) {
      throw new ForbiddenException('Siz ushbu markaz ma\'lumotlarini ko\'rish huquqiga ega emassiz');
    }

    const center = await this.prisma.educationCenter.findUnique({
      where: { id },
      include: {
        _count: { select: { students: true, teachers: true, courses: true, staff: true, administrators: true } },
      },
    });
    if (!center) throw new NotFoundException("Ta'lim markazi topilmadi");
    return center;
  }

  async create(requester: AuthUser, data: any) { 
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin yangi markaz yaratishi mumkin');
    }
    return this.prisma.educationCenter.create({ data }); 
  }

  async update(requester: AuthUser, id: number, data: any) {
    await this.findOne(requester, id);
    return this.prisma.educationCenter.update({ where: { id }, data });
  }

  async remove(requester: AuthUser, id: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat Superadmin markazni o\'chirishi mumkin');
    }
    await this.findOne(requester, id);
    await this.prisma.educationCenter.delete({ where: { id } });
    return { message: "Ta'lim markazi o'chirildi" };
  }

  async getStaff(requester: AuthUser, centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

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
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStudents(requester: AuthUser, centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.student.findMany({ 
        where, 
        include: { enrollments: { include: { course: { select: { name: true } } } } }, 
        orderBy: { createdAt: 'desc' }, 
        skip, 
        take: limit 
      }),
      this.prisma.student.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getStudent(requester: AuthUser, centerId: number, id: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);
    
    const student = await this.prisma.student.findFirst({
      where,
      include: { 
        enrollments: { include: { course: true, group: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    });
    
    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    return student;
  }

  async getTeachers(requester: AuthUser, centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

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
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTeacher(requester: AuthUser, centerId: number, id: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);
    
    const teacher = await this.prisma.teacher.findFirst({ where });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");
    return teacher;
  }

  async getCourses(requester: AuthUser, centerId: number, query: { page?: number; limit?: number; search?: string } = {}) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    
    const where: any = {};
    this.enforceCenterIsolation(where, requester, centerId);

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.course.findMany({ 
        where, 
        include: { _count: { select: { groups: true, enrollments: true } } }, 
        orderBy: { createdAt: 'desc' }, 
        skip, 
        take: limit 
      }),
      this.prisma.course.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createStudent(requester: AuthUser, centerId: number, data: any) {
    this.enforceCenterIsolation({}, requester, centerId);
    return this.prisma.student.create({ data: { ...data, centerId } });
  }

  async updateStudent(requester: AuthUser, centerId: number, id: number, data: any) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);
    
    const student = await this.prisma.student.findFirst({ where });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    
    return this.prisma.student.update({ where: { id }, data });
  }

  async deleteStudent(requester: AuthUser, centerId: number, id: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const student = await this.prisma.student.findFirst({ where });
    if (!student) throw new NotFoundException("O'quvchi topilmadi");
    
    await this.prisma.student.delete({ where: { id } });
    return { message: "O'quvchi o'chirildi" };
  }

  async createTeacher(requester: AuthUser, centerId: number, data: any) {
    this.enforceCenterIsolation({}, requester, centerId);
    return this.prisma.teacher.create({ data: { ...data, centerId } });
  }

  async updateTeacher(requester: AuthUser, centerId: number, id: number, data: any) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const teacher = await this.prisma.teacher.findFirst({ where });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");
    
    return this.prisma.teacher.update({ where: { id }, data });
  }

  async deleteTeacher(requester: AuthUser, centerId: number, id: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const teacher = await this.prisma.teacher.findFirst({ where });
    if (!teacher) throw new NotFoundException("O'qituvchi topilmadi");
    
    await this.prisma.teacher.delete({ where: { id } });
    return { message: "O'qituvchi o'chirildi" };
  }

  async createCourse(requester: AuthUser, centerId: number, data: any) {
    this.enforceCenterIsolation({}, requester, centerId);
    return this.prisma.course.create({ data: { ...data, centerId } });
  }
}
