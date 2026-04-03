import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllCourses() { return this.prisma.course.findMany(); }

  async findCourse(id: number) {
    const course = await this.prisma.course.findUnique({ where: { id }, include: { groups: true } });
    if (!course) throw new NotFoundException('Course not found');
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
    return { message: 'Course deleted' };
  }

  async findAllGroups() { return this.prisma.group.findMany(); }
  async createGroup(data: any) { return this.prisma.group.create({ data }); }
  async findAllEnrollments() { return this.prisma.enrollment.findMany({ include: { student: true, course: true } }); }
  async createEnrollment(data: any) { return this.prisma.enrollment.create({ data }); }
}
