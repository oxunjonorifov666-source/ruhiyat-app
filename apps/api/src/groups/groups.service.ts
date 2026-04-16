import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Prisma } from '@prisma/client';
import { AuthUser, UserRole } from '@ruhiyat/types';

const GROUP_LIST_SELECT = {
  id: true,
  centerId: true,
  courseId: true,
  name: true,
  description: true,
  maxStudents: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  course: { select: { id: true, name: true } },
  _count: { select: { enrollments: true } },
};

@Injectable()
export class GroupsService {
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
    courseId?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.GroupWhereInput = {};
    this.enforceCenterIsolation(where, requester, query.centerId);

    if (query.courseId) where.courseId = query.courseId;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        select: GROUP_LIST_SELECT as any,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number, centerId: number) {
    const where = { id };
    this.enforceCenterIsolation(where, requester, centerId);

    const group = await this.prisma.group.findFirst({
      where,
      select: GROUP_LIST_SELECT as any,
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');
    return group;
  }

  async create(requester: AuthUser, centerId: number, data: CreateGroupDto) {
    this.enforceCenterIsolation({}, requester, centerId);

    if (data.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: data.courseId, centerId },
      });
      if (!course) throw new BadRequestException("Kurs xato kiritildi yoki boshqa markazga tegishli");
    }

    return this.prisma.group.create({
      data: {
        centerId,
        courseId: data.courseId ?? null,
        name: data.name,
        description: data.description ?? null,
        maxStudents: data.maxStudents ?? null,
        isActive: data.isActive ?? true,
      },
      select: GROUP_LIST_SELECT as any,
    });
  }

  async update(requester: AuthUser, id: number, centerId: number, data: UpdateGroupDto) {
    await this.findOne(requester, id, centerId);

    if (data.courseId) {
      const course = await this.prisma.course.findFirst({
        where: { id: data.courseId, centerId },
      });
      if (!course) throw new BadRequestException("Kurs xato kiritildi yoki boshqa markazga tegishli");
    }

    const updateData: Prisma.GroupUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.courseId !== undefined) {
      if (data.courseId === null) updateData.course = { disconnect: true };
      else updateData.course = { connect: { id: data.courseId } };
    }
    if (data.maxStudents !== undefined) updateData.maxStudents = data.maxStudents;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.group.update({
      where: { id },
      data: updateData,
      select: GROUP_LIST_SELECT as any,
    });
  }

  async remove(requester: AuthUser, id: number, centerId: number) {
    await this.findOne(requester, id, centerId);

    const group = await this.prisma.group.findUnique({
      where: { id },
      select: { _count: { select: { enrollments: true } } },
    });

    if (group && group._count.enrollments > 0) {
      throw new ConflictException(
        "Guruhni o'chirib bo'lmaydi — unga o'quvchilar biriktirilgan. Avval ularni guruhdan chiqaring yoki guruhni arxivlang."
      );
    }

    await this.prisma.group.delete({ where: { id } });
    return { message: "Guruh o'chirildi" };
  }

  async getAnalytics(requester: AuthUser, id: number, centerId: number) {
    await this.findOne(requester, id, centerId);

    const group = await this.prisma.group.findUnique({
      where: { id },
      select: { maxStudents: true },
    });

    const enrollments = await this.prisma.enrollment.groupBy({
      by: ['status'],
      where: { groupId: id },
      _count: { id: true },
    });

    let totalStudents = 0;
    let active = 0;
    let completed = 0;
    let dropped = 0;

    for (const en of enrollments) {
      totalStudents += en._count.id;
      if (en.status === 'active') active += en._count.id;
      if (en.status === 'completed') completed += en._count.id;
      if (en.status === 'dropped') dropped += en._count.id;
    }

    const capacityUsage = group?.maxStudents 
      ? Math.round((active / group.maxStudents) * 100) 
      : (active > 0 ? 100 : 0);

    return {
      totalStudents,
      active,
      completed,
      dropped,
      capacityUsage,
      maxStudents: group?.maxStudents || null,
      statusDistribution: [
        { name: 'Faol', value: active, fill: '#6366f1' }, 
        { name: 'Tugatgan', value: completed, fill: '#22c55e' }, 
        { name: 'Tashlab ketgan', value: dropped, fill: '#ef4444' }, 
      ].filter(item => item.value > 0),
    };
  }
}
