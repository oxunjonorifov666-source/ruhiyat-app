import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const PSYCH_SELECT = {
  id: true, userId: true, centerId: true, firstName: true, lastName: true,
  specialization: true, bio: true, avatarUrl: true, licenseNumber: true,
  education: true, certifications: true, experienceYears: true,
  verificationStatus: true, isVerified: true, isAvailable: true,
  rejectionReason: true, hourlyRate: true, rating: true, totalSessions: true,
  createdAt: true, updatedAt: true,
  user: { select: { id: true, email: true, phone: true, isActive: true, isBlocked: true } },
  center: { select: { id: true, name: true } },
};

const PSYCH_LIST_SELECT = {
  id: true, userId: true, firstName: true, lastName: true,
  specialization: true, experienceYears: true, verificationStatus: true,
  isVerified: true, isAvailable: true, hourlyRate: true, rating: true,
  totalSessions: true, createdAt: true,
  user: { select: { email: true, phone: true, isActive: true } },
  center: { select: { id: true, name: true } },
};

@Injectable()
export class PsychologistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page?: number; limit?: number; search?: string;
    specialization?: string; status?: string;
    minRating?: number; minExperience?: number;
    sortBy?: string; sortOrder?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.specialization) {
      where.specialization = { contains: query.specialization, mode: 'insensitive' };
    }

    if (query.status) {
      where.verificationStatus = query.status;
    }

    if (query.minRating) {
      where.rating = { gte: query.minRating };
    }

    if (query.minExperience) {
      where.experienceYears = { gte: query.minExperience };
    }

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { specialization: { contains: query.search, mode: 'insensitive' } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    const orderBy: any = { [sortBy]: sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.psychologist.findMany({
        where,
        select: PSYCH_LIST_SELECT,
        orderBy,
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
      select: PSYCH_SELECT,
    });
    if (!p) throw new NotFoundException('Psixolog topilmadi');
    return p;
  }

  async getStats() {
    const [total, approved, pending, rejected] = await Promise.all([
      this.prisma.psychologist.count(),
      this.prisma.psychologist.count({ where: { verificationStatus: 'APPROVED' } }),
      this.prisma.psychologist.count({ where: { verificationStatus: 'PENDING' } }),
      this.prisma.psychologist.count({ where: { verificationStatus: 'REJECTED' } }),
    ]);

    return { total, approved, pending, rejected };
  }

  async create(data: {
    firstName: string; lastName: string; email?: string; phone?: string;
    specialization?: string; bio?: string; education?: string;
    certifications?: string[]; licenseNumber?: string;
    experienceYears?: number; hourlyRate?: number; centerId?: number; userId?: number;
  }) {
    if (data.centerId) {
      const center = await this.prisma.educationCenter.findUnique({ where: { id: data.centerId } });
      if (!center) throw new NotFoundException("Markaz topilmadi");
    }

    const psychData = {
      firstName: data.firstName,
      lastName: data.lastName,
      specialization: data.specialization || null,
      bio: data.bio || null,
      education: data.education || null,
      certifications: data.certifications || [],
      licenseNumber: data.licenseNumber || null,
      experienceYears: data.experienceYears || null,
      hourlyRate: data.hourlyRate || null,
      centerId: data.centerId || null,
    };

    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

      const existingPsych = await this.prisma.psychologist.findUnique({ where: { userId: data.userId } });
      if (existingPsych) throw new ConflictException('Bu foydalanuvchi allaqachon psixolog sifatida ro\'yxatdan o\'tgan');

      return this.prisma.psychologist.create({
        data: { ...psychData, userId: data.userId },
        select: PSYCH_SELECT,
      });
    }

    if (!data.email && !data.phone) {
      throw new ConflictException('Email yoki telefon raqam kiritish shart');
    }

    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }
    if (data.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing) throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }

    const tempPassword = randomBytes(12).toString('base64url');
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    return this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email || null,
          phone: data.phone || null,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash: hashedPassword,
          role: 'MOBILE_USER',
          isVerified: true,
        },
      });

      return tx.psychologist.create({
        data: { ...psychData, userId: newUser.id },
        select: PSYCH_SELECT,
      });
    });
  }

  async update(id: number, data: {
    firstName?: string; lastName?: string; specialization?: string;
    bio?: string; education?: string; certifications?: string[];
    licenseNumber?: string; experienceYears?: number;
    hourlyRate?: number; isAvailable?: boolean;
  }) {
    await this.findOne(id);

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.certifications !== undefined) updateData.certifications = data.certifications;
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.experienceYears !== undefined) updateData.experienceYears = data.experienceYears;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;

    return this.prisma.psychologist.update({
      where: { id },
      data: updateData,
      select: PSYCH_SELECT,
    });
  }

  async verify(id: number) {
    const psych = await this.findOne(id);
    if (psych.verificationStatus === 'APPROVED') {
      throw new ConflictException('Psixolog allaqachon tasdiqlangan');
    }
    return this.prisma.psychologist.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED',
        isVerified: true,
        rejectionReason: null,
      },
      select: PSYCH_SELECT,
    });
  }

  async reject(id: number, reason?: string) {
    const psych = await this.findOne(id);
    if (psych.verificationStatus === 'REJECTED') {
      throw new ConflictException('Psixolog allaqachon rad etilgan');
    }
    return this.prisma.psychologist.update({
      where: { id },
      data: {
        verificationStatus: 'REJECTED',
        isVerified: false,
        rejectionReason: reason || null,
      },
      select: PSYCH_SELECT,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.psychologist.delete({ where: { id } });
    return { message: "Psixolog o'chirildi" };
  }
}
