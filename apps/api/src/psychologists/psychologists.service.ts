import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PsychologistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { specialization: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.psychologist.findMany({
        where,
        include: {
          user: { select: { email: true, phone: true, isActive: true } },
          center: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.psychologist.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: number) {
    const p = await this.prisma.psychologist.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, phone: true, isActive: true } },
        center: { select: { id: true, name: true } },
      },
    });
    if (!p) throw new NotFoundException('Psixolog topilmadi');
    return p;
  }

  async create(data: any) {
    if (data.userId) {
      return this.prisma.psychologist.create({
        data,
        include: { user: { select: { email: true, phone: true } } },
      });
    }
    const tempPassword = randomBytes(12).toString('base64url');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    return this.prisma.psychologist.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        specialization: data.specialization || null,
        licenseNumber: data.licenseNumber || null,
        experienceYears: data.experienceYears || null,
        hourlyRate: data.hourlyRate || null,
        centerId: data.centerId || null,
        user: {
          create: {
            email: data.email || null,
            phone: data.phone || null,
            firstName: data.firstName,
            lastName: data.lastName,
            passwordHash: hashedPassword,
            role: 'MOBILE_USER',
          },
        },
      },
      include: { user: { select: { email: true, phone: true } } },
    });
  }

  async update(id: number, data: any) {
    await this.findOne(id);
    return this.prisma.psychologist.update({
      where: { id },
      data,
      include: { user: { select: { email: true, phone: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.psychologist.delete({ where: { id } });
    return { message: "Psixolog o'chirildi" };
  }
}
