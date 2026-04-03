import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, SendOtpDto, VerifyOtpDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, phone, password, firstName, lastName } = dto;

    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');
    }

    if (phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (existing) throw new ConflictException('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan');
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: UserRole.MOBILE_USER,
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const { email, phone, password } = dto;

    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : phone
        ? await this.prisma.user.findUnique({ where: { phone } })
        : null;

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Noto\'g\'ri hisob ma\'lumotlari');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Noto\'g\'ri hisob ma\'lumotlari');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Hisob bloklangan');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        administrator: { select: { id: true, centerId: true, position: true, center: { select: { id: true, name: true } } } },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    return { user };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshToken: tokenHash, isRevoked: false },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Yaroqsiz yoki muddati o\'tgan token');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(session.user.id, session.user.role);
    await this.createSession(session.user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshToken: tokenHash },
      data: { isRevoked: true },
    });
    return { message: 'Muvaffaqiyatli chiqildi' };
  }

  async sendOtp(dto: SendOtpDto) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpVerification.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        code,
        purpose: dto.purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return { message: 'Tasdiqlash kodi yuborildi' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const where: any = { purpose: dto.purpose, isUsed: false };
    if (dto.phone) where.phone = dto.phone;
    if (dto.email) where.email = dto.email;

    const otp = await this.prisma.otpVerification.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Yaroqsiz yoki muddati o\'tgan kod');
    }

    if (otp.attempts >= 5) {
      throw new UnauthorizedException('Urinishlar soni oshib ketdi');
    }

    if (otp.code !== dto.code) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Noto\'g\'ri tasdiqlash kodi');
    }

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    if (dto.purpose === 'login' && dto.phone) {
      let user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (user) {
        const tokens = await this.generateTokens(user.id, user.role);
        await this.createSession(user.id, tokens.refreshToken);
        return {
          message: 'Tasdiqlandi',
          verified: true,
          user: this.sanitizeUser(user),
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      }
    }

    return { message: 'Tasdiqlandi', verified: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'Agar bu email mavjud bo\'lsa, tiklash kodi yuborildi' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        email,
        code,
        purpose: 'password_reset',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    return { message: 'Agar bu email mavjud bo\'lsa, tiklash kodi yuborildi' };
  }

  async resetPassword(token: string, newPassword: string) {
    const otp = await this.prisma.otpVerification.findFirst({
      where: { code: token, purpose: 'password_reset', isUsed: false },
    });

    if (!otp || !otp.userId || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Yaroqsiz yoki muddati o\'tgan tiklash kodi');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: otp.userId },
      data: { passwordHash },
    });

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return { message: 'Parol muvaffaqiyatli tiklandi' };
  }

  private sanitizeUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  private async generateTokens(userId: number, role: string) {
    const payload = { sub: userId, role };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'ruhiyat-refresh-dev-secret-NOT-FOR-PRODUCTION';

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async createSession(userId: number, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
