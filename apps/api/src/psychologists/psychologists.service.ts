import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

const PSYCH_SELECT = {
  id: true, userId: true, centerId: true, firstName: true, lastName: true,
  patronymic: true, gender: true, dateOfBirth: true,
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
  patronymic: true, gender: true,
  specialization: true, experienceYears: true, verificationStatus: true,
  isVerified: true, isAvailable: true, hourlyRate: true, rating: true,
  totalSessions: true, createdAt: true,
  user: { select: { email: true, phone: true, isActive: true } },
  center: { select: { id: true, name: true } },
};

@Injectable()
export class PsychologistsService {
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
    page?: number; limit?: number; search?: string;
    specialization?: string; status?: string;
    minRating?: number; minExperience?: number;
    sortBy?: string; sortOrder?: string;
    centerId?: number;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (requester.role !== UserRole.SUPERADMIN || query.centerId) {
      this.enforceCenterIsolation(where, requester, query.centerId);
    }

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

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(requester: AuthUser, id: number, centerId?: number) {
    const where: any = { id };
    if (requester.role !== UserRole.SUPERADMIN || centerId) {
      this.enforceCenterIsolation(where, requester, centerId);
    }

    const p = await this.prisma.psychologist.findFirst({
      where,
      select: PSYCH_SELECT,
    });
    if (!p) throw new NotFoundException('Psixolog topilmadi');
    return p;
  }

  async getStats(requester: AuthUser, centerId?: number) {
    const where: any = {};
    if (requester.role !== UserRole.SUPERADMIN || centerId) {
      this.enforceCenterIsolation(where, requester, centerId);
    }

    const [total, approved, pending, rejected] = await Promise.all([
      this.prisma.psychologist.count({ where }),
      this.prisma.psychologist.count({ where: { ...where, verificationStatus: 'APPROVED' } }),
      this.prisma.psychologist.count({ where: { ...where, verificationStatus: 'PENDING' } }),
      this.prisma.psychologist.count({ where: { ...where, verificationStatus: 'REJECTED' } }),
    ]);

    return { total, approved, pending, rejected };
  }

  async create(requester: AuthUser, data: any) {
    const targetCenterId = requester.role === UserRole.SUPERADMIN ? data.centerId : requester.centerId;
    if (targetCenterId) {
      const center = await this.prisma.educationCenter.findUnique({ where: { id: targetCenterId } });
      if (!center) throw new NotFoundException("Markaz topilmadi");
    }

    const psychData = {
      firstName: data.firstName,
      lastName: data.lastName,
      patronymic: data.patronymic || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      specialization: data.specialization || null,
      bio: data.bio || null,
      education: data.education || null,
      certifications: data.certifications || [],
      licenseNumber: data.licenseNumber || null,
      experienceYears: data.experienceYears ? parseInt(data.experienceYears as any) : null,
      hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate as any) : null,
      avatarUrl: data.avatarUrl || null,
      centerId: targetCenterId || null,
    };

    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: parseInt(data.userId as any) } });
      if (!user) throw new NotFoundException('Foydalanuvchi topilmadi');

      const existingPsych = await this.prisma.psychologist.findUnique({ where: { userId: parseInt(data.userId as any) } });
      if (existingPsych) throw new ConflictException('Bu foydalanuvchi allaqachon psixolog sifatida ro\'yxatdan o\'tgan');

      return this.prisma.psychologist.create({
        data: { ...psychData, userId: parseInt(data.userId as any) },
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

    return this.prisma.$transaction(async (tx: any) => {
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

  async update(requester: AuthUser, id: number, centerId: number | undefined, data: any) {
    await this.findOne(requester, id, centerId);

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.patronymic !== undefined) updateData.patronymic = data.patronymic;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.education !== undefined) updateData.education = data.education;
    if (data.certifications !== undefined) updateData.certifications = data.certifications;
    if (data.licenseNumber !== undefined) updateData.licenseNumber = data.licenseNumber;
    if (data.experienceYears !== undefined) updateData.experienceYears = parseInt(data.experienceYears as any);
    if (data.hourlyRate !== undefined) updateData.hourlyRate = parseFloat(data.hourlyRate as any);
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;

    return this.prisma.psychologist.update({
      where: { id },
      data: updateData,
      select: PSYCH_SELECT,
    });
  }

  async verify(requester: AuthUser, id: number, centerId?: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat Superadmin psixologni tasdiqlashi mumkin");
    }
    const psych = await this.findOne(requester, id, centerId);
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

  async reject(requester: AuthUser, id: number, centerId?: number, reason?: string) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat Superadmin psixologni rad etishi mumkin");
    }
    const psych = await this.findOne(requester, id, centerId);
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

  async remove(requester: AuthUser, id: number, centerId?: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat Superadmin psixologni o'chirishi mumkin");
    }
    await this.findOne(requester, id, centerId);
    await this.prisma.psychologist.delete({ where: { id } });
    return { message: 'Psixolog o\'chirildi' };
  }

  async assignToCenter(requester: AuthUser, id: number, centerId: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat Superadmin psixologni markazga biriktira oladi");
    }
    await this.findOne(requester, id);
    return this.prisma.psychologist.update({
      where: { id },
      data: { centerId }
    });
  }

  async unassignFromCenter(requester: AuthUser, id: number, centerId: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException("Faqat Superadmin psixologni markazdan ajrata oladi");
    }
    const psychologist = await this.prisma.psychologist.findFirst({ where: { id, centerId } });
    if (!psychologist) throw new NotFoundException("Psixolog ushbu markazga tegishli emas");
    return this.prisma.psychologist.update({
      where: { id },
      data: { centerId: null }
    });
  }

  /** Mobil ilova katalogi: tasdiqlangan psixologlar (barcha markazlar / mustaqillar). */
  async findMobileDirectory(query: {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;
    const where: any = {
      verificationStatus: 'APPROVED',
      isVerified: true,
      user: { isActive: true, isBlocked: false },
    };
    if (query.specialization && query.specialization !== 'Barchasi') {
      where.specialization = { contains: query.specialization, mode: 'insensitive' };
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { specialization: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.psychologist.findMany({
        where,
        select: {
          ...PSYCH_LIST_SELECT,
          bio: true,
          avatarUrl: true,
        },
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.psychologist.count({ where }),
    ]);
    const mapped = data.map((p: any) => ({
      ...p,
      sessionPrice: p.hourlyRate != null ? Math.round(Number(p.hourlyRate)) : null,
    }));
    return { data: mapped, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /** Mobil ilova: bitta katalog kartasi — faqat tasdiqlangan va faol foydalanuvchili profillar. */
  async findMobileById(id: number) {
    const p = await this.prisma.psychologist.findFirst({
      where: {
        id,
        verificationStatus: 'APPROVED',
        isVerified: true,
        user: { isActive: true, isBlocked: false },
      },
      select: {
        ...PSYCH_LIST_SELECT,
        bio: true,
        avatarUrl: true,
        education: true,
        certifications: true,
        licenseNumber: true,
      },
    });
    if (!p) throw new NotFoundException('Psixolog topilmadi');
    return {
      ...p,
      sessionPrice: p.hourlyRate != null ? Math.round(Number(p.hourlyRate)) : null,
    };
  }
}
