import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EducationCentersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() { return this.prisma.educationCenter.findMany(); }

  async findOne(id: number) {
    const center = await this.prisma.educationCenter.findUnique({ where: { id } });
    if (!center) throw new NotFoundException('Education center not found');
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
    return { message: 'Education center deleted' };
  }

  async getStaff(id: number) {
    await this.findOne(id);
    return this.prisma.staff.findMany({ where: { centerId: id } });
  }

  async getStudents(id: number) {
    await this.findOne(id);
    return this.prisma.student.findMany({ where: { centerId: id } });
  }

  async getTeachers(id: number) {
    await this.findOne(id);
    return this.prisma.teacher.findMany({ where: { centerId: id } });
  }

  async getCourses(id: number) {
    await this.findOne(id);
    return this.prisma.course.findMany({ where: { centerId: id } });
  }
}
