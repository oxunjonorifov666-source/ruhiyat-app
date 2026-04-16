import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, CourseStatus } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Prisma } from '@prisma/client';
import { AuthUser, UserRole } from '@ruhiyat/types';

const COURSE_LIST_SELECT = {
  id: true,
  centerId: true,
  name: true,
  code: true,
  description: true,
  status: true,
  durationWeeks: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { groups: true, enrollments: true } },
} satisfies Prisma.CourseSelect;

const COURSE_DETAIL_SELECT = {
  id: true,
  centerId: true,
  name: true,
  code: true,
  description: true,
  status: true,
  durationWeeks: true,
  createdAt: true,
  updatedAt: true,
  center: { select: { id: true, name: true } },
  _count: { select: { groups: true, enrollments: true } },
} satisfies Prisma.CourseSelect;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findAll(requester: AuthUser, query: {
    page?: number;
    limit?: number;
    search?: string;
    centerId?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};
    this.enforceCenterIsolation(where, requester, query.centerId);

    if (query.status && query.status !== 'all') {
      where.status = query.status as any;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { code: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc') as Prisma.SortOrder;
    const orderBy: Prisma.CourseOrderByWithRelationInput = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        select: COURSE_LIST_SELECT,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number, centerId: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const course = await this.prisma.course.findFirst({
      where,
      select: COURSE_DETAIL_SELECT,
    });
    if (!course) throw new NotFoundException('Kurs topilmadi');
    return course;
  }

  async getStats(requester: AuthUser, centerId: number) {
    const where = {};
    this.enforceCenterIsolation(where, requester, centerId);

    const [total, active, draft, archived] = await Promise.all([
      this.prisma.course.count({ where }),
      this.prisma.course.count({ where: { ...where, status: 'ACTIVE' } }),
      this.prisma.course.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.course.count({ where: { ...where, status: 'ARCHIVED' } }),
    ]);
    return { total, active, draft, archived };
  }

  async create(requester: AuthUser, centerId: number, data: CreateCourseDto) {
    this.enforceCenterIsolation({}, requester, centerId);

    if (data.code) {
      const existing = await this.prisma.course.findFirst({
        where: { centerId, code: data.code },
      });
      if (existing) {
        throw new ConflictException(`'${data.code}' kodi ushbu markazda allaqachon mavjud`);
      }
    }

    return this.prisma.course.create({
      data: {
        centerId,
        name: data.name,
        code: data.code ?? null,
        description: data.description ?? null,
        status: data.status ?? CourseStatus.DRAFT,
        durationWeeks: data.durationWeeks ?? null,
      },
      select: COURSE_DETAIL_SELECT,
    });
  }

  async update(requester: AuthUser, id: number, centerId: number, data: UpdateCourseDto) {
    await this.findOne(requester, id, centerId);

    if (data.code) {
      const existing = await this.prisma.course.findFirst({
        where: { centerId, code: data.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`'${data.code}' kodi ushbu markazda allaqachon mavjud`);
      }
    }

    const updateData: Prisma.CourseUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.durationWeeks !== undefined) updateData.durationWeeks = data.durationWeeks;

    return this.prisma.course.update({
      where: { id },
      data: updateData,
      select: COURSE_DETAIL_SELECT,
    });
  }

  async remove(requester: AuthUser, id: number, centerId: number) {
    await this.findOne(requester, id, centerId);

    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { _count: { select: { enrollments: true, groups: true } } },
    });

    if (course && (course._count.enrollments > 0 || course._count.groups > 0)) {
      throw new ConflictException(
        "Kursni o'chirib bo'lmaydi — unga bog'liq guruhlar yoki yozilishlar mavjud. Avval arxivlang.",
      );
    }

    await this.prisma.course.update({ where: { id }, data: { status: 'ARCHIVED' } });
    return { message: "Kurs arxivlandi" };
  }

  async getAnalytics(requester: AuthUser, id: number, centerId: number) {
    await this.findOne(requester, id, centerId);

    const [groups, enrollments] = await Promise.all([
      this.prisma.group.findMany({
        where: { courseId: id, centerId },
        include: { _count: { select: { enrollments: true } } },
      }),
      this.prisma.enrollment.groupBy({
        by: ['status'],
        where: { courseId: id },
        _count: { id: true },
      }),
    ]);

    let totalEnrollments = 0;
    let completed = 0;

    for (const en of enrollments) {
      totalEnrollments += en._count.id;
      if (en.status === 'completed') completed += en._count.id;
    }

    const activeGroupsCount = groups.filter(g => g.isActive).length;
    let totalGroupEnrollments = 0;
    groups.forEach(g => { totalGroupEnrollments += g._count.enrollments });
    
    const averageGroupSize = activeGroupsCount > 0 ? Math.round(totalGroupEnrollments / activeGroupsCount) : 0;
    const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0;

    return {
      totalEnrollments,
      activeGroupsCount,
      totalGroupsCount: groups.length,
      averageGroupSize,
      completionRate,
      completed,
    };
  }
}
