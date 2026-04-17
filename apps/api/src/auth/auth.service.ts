import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';
import {
  LoginDto,
  RegisterDto,
  SendOtpDto,
  VerifyOtpDto,
  UpdateProfileDto,
  ChangePasswordDto,
  ResetPasswordDto,
  VerifyPasswordResetOtpDto,
} from './dto';
import { DeliveryService } from '../notifications/delivery.service';
import { isValidUzbekMobileE164, normalizeUzbekPhoneE164 } from '../common/uzbek-phone.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly delivery: DeliveryService,
  ) {}

  private getPasswordResetSecret(): string {
    return (
      this.configService.get<string>('JWT_PASSWORD_RESET_SECRET') ||
      `${this.configService.get<string>('JWT_SECRET') || 'ruhiyat-dev'}.pwd-reset.v1`
    );
  }

  private signPasswordResetToken(userId: number, otpId: number): string {
    return this.jwtService.sign(
      { sub: userId, otpId, typ: 'pwd-reset' },
      { secret: this.getPasswordResetSecret(), expiresIn: '15m' },
    );
  }

  async register(dto: RegisterDto) {
    let { email, phone, password, firstName, lastName, code } = dto as RegisterDto & { code?: string };
    if (email) {
      email = email.trim().toLowerCase();
    }
    if (phone) {
      phone = normalizeUzbekPhoneE164(phone);
      if (!isValidUzbekMobileE164(phone)) {
        throw new BadRequestException("Telefon raqam formati noto'g'ri (+998XXXXXXXXX)");
      }
    }
    if (password) {
      await this.enforcePasswordPolicy(password);
    }

    const skipOtp = this.configService.get<string>('AUTH_SKIP_REGISTER_OTP') === 'true';
    if (!skipOtp) {
      if (!phone && !email) {
        throw new BadRequestException('Ro‘yxatdan o‘tish uchun telefon yoki email kiriting');
      }
      if (!code || !/^\d{6}$/.test(code)) {
        throw new BadRequestException('Avval tasdiqlash kodini oling va 6 raqamli kodni kiriting');
      }
      const whereOtp: Record<string, unknown> = {
        purpose: 'registration',
        isUsed: false,
        expiresAt: { gt: new Date() },
      };
      if (phone) whereOtp.phone = phone;
      if (email) whereOtp.email = email;
      const otp = await this.prisma.otpVerification.findFirst({
        where: whereOtp as any,
        orderBy: { createdAt: 'desc' },
      });
      if (!otp || otp.code !== code) {
        if (otp && otp.code !== code) {
          await this.prisma.otpVerification
            .update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })
            .catch(() => undefined);
        }
        throw new UnauthorizedException('Noto‘g‘ri yoki muddati o‘tgan tasdiqlash kodi');
      }
      await this.prisma.otpVerification.update({ where: { id: otp.id }, data: { isUsed: true } });
    }

    if (!String(email || '').trim() && !String(phone || '').trim()) {
      throw new BadRequestException('Email yoki telefon majburiy');
    }

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
        role: UserRole.MOBILE_USER as any,
      },
    });

    const authUser = await this.getAuthUserContext(user.id);
    const tokens = await this.generateTokens(authUser);
    await this.createSession(user.id, tokens.refreshToken, (dto as any).ipAddress, (dto as any).deviceInfo);
    await this.createSecurityLog({
      userId: user.id,
      event: 'REGISTER',
      success: true,
      ipAddress: (dto as any).ipAddress,
      userAgent: (dto as any).deviceInfo,
      details: { email, phone },
    });

    return {
      user: authUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const password = dto.password;
    let email = dto.email?.trim() ? dto.email.trim().toLowerCase() : undefined;
    let phone = dto.phone?.trim() ? dto.phone.trim() : undefined;
    if (phone) {
      phone = normalizeUzbekPhoneE164(phone);
      if (!isValidUzbekMobileE164(phone)) {
        throw new BadRequestException("Telefon raqam formati noto'g'ri (+998XXXXXXXXX)");
      }
    }
    if (!email && !phone) {
      throw new BadRequestException('Email yoki telefon kiriting');
    }
    if (email && phone) {
      throw new BadRequestException('Faqat email yoki telefon — ikkalasini birga yubormang');
    }

    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : phone
          ? await this.prisma.user.findUnique({ where: { phone } })
          : null;

    if (!user || !user.passwordHash) {
      await this.createSecurityLog({
        userId: user?.id || null,
        event: 'LOGIN',
        success: false,
        ipAddress: dto.ipAddress,
        userAgent: dto.deviceInfo,
        details: { email, phone, reason: 'USER_NOT_FOUND' },
      });
      throw new UnauthorizedException('Noto\'g\'ri hisob ma\'lumotlari');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      await this.createSecurityLog({
        userId: user.id,
        event: 'LOGIN',
        success: false,
        ipAddress: dto.ipAddress,
        userAgent: dto.deviceInfo,
        details: { reason: 'INVALID_PASSWORD' },
      });
      throw new UnauthorizedException('Noto\'g\'ri hisob ma\'lumotlari');
    }

    if (!user.isActive) {
      await this.createSecurityLog({
        userId: user.id,
        event: 'LOGIN',
        success: false,
        ipAddress: dto.ipAddress,
        userAgent: dto.deviceInfo,
        details: { reason: 'INACTIVE_USER' },
      });
      throw new ForbiddenException('Hisob bloklangan');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authUser = await this.getAuthUserContext(user.id);
    const tokens = await this.generateTokens(authUser);
    await this.createSession(user.id, tokens.refreshToken, dto.ipAddress, dto.deviceInfo);
    await this.createSecurityLog({
      userId: user.id,
      event: 'LOGIN',
      success: true,
      ipAddress: dto.ipAddress,
      userAgent: dto.deviceInfo,
      details: { via: email ? 'email' : 'phone' },
    });

    return {
      user: authUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async getProfile(userId: number) {
    const user = await this.getAuthUserContext(userId);
    return { user };
  }

  async refreshTokens(refreshToken: string, ctx?: { ipAddress?: string; deviceInfo?: string }) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshToken: tokenHash, isRevoked: false },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      await this.createSecurityLog({
        userId: session?.userId || null,
        event: 'REFRESH',
        success: false,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.deviceInfo,
        details: { reason: 'INVALID_OR_EXPIRED' },
      });
      throw new UnauthorizedException('Yaroqsiz yoki muddati o\'tgan token');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const authUser = await this.getAuthUserContext(session.user.id);
    const tokens = await this.generateTokens(authUser);
    await this.createSession(session.user.id, tokens.refreshToken, ctx?.ipAddress, ctx?.deviceInfo);
    await this.createSecurityLog({
      userId: session.user.id,
      event: 'REFRESH',
      success: true,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.deviceInfo,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(refreshToken: string, ctx?: { ipAddress?: string; deviceInfo?: string }) {
    const tokenHash = this.hashToken(refreshToken);
    const sessions = await this.prisma.session.findMany({
      where: { refreshToken: tokenHash },
      select: { userId: true },
      take: 1,
    });
    await this.prisma.session.updateMany({
      where: { refreshToken: tokenHash },
      data: { isRevoked: true },
    });
    await this.createSecurityLog({
      userId: sessions[0]?.userId || null,
      event: 'LOGOUT',
      success: true,
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.deviceInfo,
    });
    return { message: 'Muvaffaqiyatli chiqildi' };
  }

  async sendOtp(dto: SendOtpDto) {
    let phone: string | undefined;
    let email: string | undefined;

    if (dto.phone) {
      phone = normalizeUzbekPhoneE164(dto.phone);
      if (!isValidUzbekMobileE164(phone)) {
        throw new BadRequestException("Telefon raqam formati noto'g'ri (+998XXXXXXXXX)");
      }
    }
    if (dto.email) {
      email = dto.email.trim().toLowerCase();
    }
    if (!phone && !email) {
      throw new BadRequestException('Telefon yoki email kiriting');
    }
    if (phone && email) {
      throw new BadRequestException('Bir vaqtning o‘zida telefon va email yuborilmaydi');
    }

    if (dto.purpose === 'registration') {
      if (phone) {
        const taken = await this.prisma.user.findUnique({ where: { phone }, select: { id: true } });
        if (taken) throw new ConflictException('Bu telefon raqam allaqachon ro‘yxatdan o‘tgan');
      }
      if (email) {
        const taken = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (taken) throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan');
      }
    }

    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const otp = await this.prisma.otpVerification.create({
      data: {
        phone,
        email,
        code,
        purpose: dto.purpose,
        expiresAt,
        attempts: 0,
      },
    });

    try {
      if (phone) {
        await this.delivery.sendOtpSms(phone, code, dto.purpose);
      } else if (email) {
        await this.delivery.sendOtpEmail(email, code, dto.purpose);
      }
    } catch (e) {
      await this.prisma.otpVerification.delete({ where: { id: otp.id } }).catch(() => undefined);
      const detail = e instanceof Error ? e.message : String(e);
      const channel = phone ? 'sms' : 'email';
      this.logger.error(`OTP yuborilmadi purpose=${dto.purpose} channel=${channel}: ${detail}`, e instanceof Error ? e.stack : undefined);
      throw new BadRequestException("Kod yuborilmadi. Keyinroq qayta urinib ko'ring.");
    }

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    const returnDevCode = !isProd && this.configService.get<string>('AUTH_DEV_RETURN_OTP') === 'true';
    return {
      message: 'Tasdiqlash kodi yuborildi',
      expiresAt: otp.expiresAt,
      ...(returnDevCode ? { devCode: code } : {}),
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    let phone: string | undefined;
    let email: string | undefined;
    if (dto.phone) {
      phone = normalizeUzbekPhoneE164(dto.phone);
      if (!isValidUzbekMobileE164(phone)) {
        throw new BadRequestException("Telefon raqam formati noto'g'ri (+998XXXXXXXXX)");
      }
    }
    if (dto.email) {
      email = dto.email.trim().toLowerCase();
    }

    const where: any = { purpose: dto.purpose, isUsed: false };
    if (phone) where.phone = phone;
    if (email) where.email = email;

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

    if (dto.purpose === 'login' && phone) {
      const user = await this.prisma.user.findUnique({ where: { phone } });
      if (user) {
        const authUser = await this.getAuthUserContext(user.id);
        const tokens = await this.generateTokens(authUser);
        await this.createSession(user.id, tokens.refreshToken, dto.ipAddress, dto.deviceInfo);
        return {
          message: 'Tasdiqlandi',
          verified: true,
          user: authUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      }
    }

    return { message: 'Tasdiqlandi', verified: true };
  }

  async requestPasswordReset(dto: { email?: string; phone?: string }) {
    let email = dto.email?.trim() ? dto.email.trim().toLowerCase() : undefined;
    let phone = dto.phone?.trim() ? normalizeUzbekPhoneE164(dto.phone) : undefined;
    if (phone && !isValidUzbekMobileE164(phone)) {
      throw new BadRequestException("Telefon raqam formati noto'g'ri (+998XXXXXXXXX)");
    }
    if (!email && !phone) {
      throw new BadRequestException('Email yoki telefon kiriting');
    }

    const user = phone
      ? await this.prisma.user.findUnique({ where: { phone } })
      : await this.prisma.user.findUnique({ where: { email: email! } });

    if (!user) {
      return { message: 'Agar akkaunt mavjud bo\'lsa, tiklash kodi yuboriladi' };
    }

    const code = String(randomInt(100_000, 1_000_000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const otpRecord = await this.prisma.otpVerification.create({
      data: {
        userId: user.id,
        email: email || user.email || null,
        phone: phone || user.phone || null,
        code,
        purpose: 'password_reset',
        expiresAt,
        attempts: 0,
      },
    });

    try {
      if (phone) {
        await this.delivery.sendPasswordResetSms(phone, code);
      } else if (email) {
        await this.delivery.sendPasswordResetEmail(email, code);
      }
    } catch (e) {
      await this.prisma.otpVerification.delete({ where: { id: otpRecord.id } }).catch(() => undefined);
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`Parol tiklash OTP yuborilmadi userId=${user.id}: ${detail}`, e instanceof Error ? e.stack : undefined);
      throw new BadRequestException("Kod yuborilmadi. Keyinroq qayta urinib ko'ring.");
    }

    return { message: 'Agar akkaunt mavjud bo\'lsa, tiklash kodi yuboriladi' };
  }

  async verifyPasswordResetOtp(dto: VerifyPasswordResetOtpDto) {
    let email = dto.email?.trim() ? dto.email.trim().toLowerCase() : undefined;
    let phone = dto.phone?.trim() ? normalizeUzbekPhoneE164(dto.phone) : undefined;
    if (phone && !isValidUzbekMobileE164(phone)) {
      throw new BadRequestException("Telefon raqam formati noto'g'ri (+998XXXXXXXXX)");
    }
    if (!email && !phone) {
      throw new BadRequestException('Email yoki telefon kiriting');
    }

    const where: { purpose: string; isUsed: boolean; phone?: string; email?: string } = {
      purpose: 'password_reset',
      isUsed: false,
    };
    if (phone) where.phone = phone;
    if (email) where.email = email;

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

    if (!otp.userId) {
      throw new BadRequestException('Tiklash yozuvi noto\'g\'ri');
    }

    const resetToken = this.signPasswordResetToken(otp.userId, otp.id);

    return {
      message: 'Kod tasdiqlandi',
      resetToken,
      expiresInSec: 15 * 60,
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      throw new BadRequestException('Parol o\'rnatilmagan');
    }
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Joriy parol noto\'g\'ri');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Yangi parol avvalgisidan farq qilishi kerak');
    }
    await this.enforcePasswordPolicy(dto.newPassword);
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    await this.createSecurityLog({
      userId,
      event: 'PASSWORD_CHANGE',
      success: true,
      details: { via: 'authenticated' },
    });
    return { message: 'Parol muvaffaqiyatli yangilandi' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    await this.enforcePasswordPolicy(dto.newPassword);

    if (dto.resetToken) {
      let payload: { sub: number; otpId: number; typ?: string };
      try {
        payload = this.jwtService.verify(dto.resetToken, {
          secret: this.getPasswordResetSecret(),
        }) as { sub: number; otpId: number; typ?: string };
      } catch {
        throw new UnauthorizedException('Yaroqsiz yoki muddati o\'tgan tiklash sessiyasi');
      }
      if (payload.typ !== 'pwd-reset') {
        throw new UnauthorizedException('Noto\'g\'ri tiklash tokeni');
      }

      const otp = await this.prisma.otpVerification.findFirst({
        where: {
          id: payload.otpId,
          userId: payload.sub,
          purpose: 'password_reset',
          isUsed: false,
        },
      });

      if (!otp || otp.expiresAt < new Date()) {
        throw new UnauthorizedException('Yaroqsiz yoki muddati o\'tgan tiklash kodi');
      }

      const passwordHash = await bcrypt.hash(dto.newPassword, 12);
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });

      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { isUsed: true },
      });

      await this.createSecurityLog({
        userId: payload.sub,
        event: 'PASSWORD_RESET',
        success: true,
        details: { via: 'otp_jwt' },
      });

      return { message: 'Parol muvaffaqiyatli tiklandi' };
    }

    if (dto.token) {
      return this.resetPasswordWithLegacyCode(dto.token, dto.newPassword);
    }

    throw new BadRequestException('Tiklash tokeni yoki 6 raqamli kod kiriting');
  }

  private async resetPasswordWithLegacyCode(token: string, newPassword: string) {
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

    await this.createSecurityLog({
      userId: otp.userId,
      event: 'PASSWORD_RESET',
      success: true,
      details: { via: 'legacy_code' },
    });

    return { message: 'Parol muvaffaqiyatli tiklandi' };
  }

  async getAuthUserContext(userId: number): Promise<AuthUser> {
    if (userId === undefined || userId === null || isNaN(userId)) {
      throw new BadRequestException('Noto\'g\'ri foydalanuvchi identifikatori');
    }
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        administrator: { select: { centerId: true } },
        mobileUser: true
      },
    });

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi');
    }

    // Auto-create MobileUser if missing for MOBILE_USER role (upsert — parallel login/register P2002 dan saqlaydi)
    if (!user.mobileUser && user.role === 'MOBILE_USER') {
      await this.prisma.mobileUser.upsert({
        where: { userId },
        create: {
          userId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        update: {},
      });
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          administrator: { select: { centerId: true } },
          mobileUser: true,
        },
      });
      if (!user) {
        throw new UnauthorizedException('Foydalanuvchi topilmadi');
      }
    }

    const permissions = await this.getUserPermissions(userId);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      centerId: user.administrator?.centerId || null,
      avatarUrl: user.mobileUser?.avatarUrl || null,
      isPremium: user.mobileUser?.isPremium || false,
      gender: user.mobileUser?.gender || null,
      dateOfBirth: user.mobileUser?.dateOfBirth?.toISOString() || null,
      bio: user.mobileUser?.bio || null,
      onboardingCompletedAt: user.mobileUser?.onboardingCompletedAt?.toISOString() || null,
      notificationPrefs: user.mobileUser?.notificationPrefs ?? null,
      analyticsOptIn: user.mobileUser?.analyticsOptIn ?? false,
      biometricEnabled: user.mobileUser?.biometricEnabled ?? false,
      permissions,
    } as any;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const { firstName, lastName, email, avatarUrl, gender, dateOfBirth, bio } = dto;

    // Update base user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        email: email !== undefined ? email : undefined,
      },
    });

    // Update or Create mobile user info
    await this.prisma.mobileUser.upsert({
      where: { userId },
      create: {
        userId,
        firstName,
        lastName,
        avatarUrl,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        bio,
      },
      update: {
        firstName,
        lastName,
        avatarUrl,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        bio,
      },
    });

    return this.getAuthUserContext(userId);
  }



  async getUserPermissions(userId: number): Promise<string[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    if (user.role === 'SUPERADMIN') {
      return ['*'];
    }

    const roleMap: Record<string, string> = {
      'ADMINISTRATOR': 'ADMIN',
      'MOBILE_USER': 'USER',
    };
    const roleName = roleMap[user.role] || user.role;
    const role = await this.prisma.role.findFirst({
      where: { name: roleName, centerId: null },
      include: { permissions: true },
    });

    if (!role) return [];
    return (role as any).permissions.map((p: any) => `${p.resource}.${p.action}`);
  }

  private async generateTokens(user: AuthUser) {
    const payload = {
      sub: user.id,
      role: user.role,
      cid: user.centerId,
      pms: user.permissions,
    };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret || 'ruhiyat-refresh-dev-secret-NOT-FOR-PRODUCTION',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async createSession(userId: number, refreshToken: string, ipAddress?: string, deviceInfo?: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.session.create({
      data: {
        userId,
        refreshToken: tokenHash,
        ipAddress,
        deviceInfo,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  private async enforcePasswordPolicy(password: string) {
    const keys = [
      'security.passwordMinLength',
      'security.passwordRequireUpperLowerDigit',
      'security.passwordRequireSpecial',
    ];
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    });
    const get = (key: string) => rows.find((r) => r.key === key)?.value ?? null;
    const minLen = parseInt((get(keys[0]) as any) || '8', 10);
    const requireUpperLowerDigit = ((get(keys[1]) as any) ?? 'true') === 'true';
    const requireSpecial = ((get(keys[2]) as any) ?? 'false') === 'true';

    if (password.length < minLen) {
      throw new BadRequestException(`Parol kamida ${minLen} ta belgidan iborat bo‘lishi kerak`);
    }
    if (requireUpperLowerDigit) {
      const ok = /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
      if (!ok) {
        throw new BadRequestException("Parol kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo‘lishi kerak");
      }
    }
    if (requireSpecial) {
      const ok = /[^A-Za-z0-9]/.test(password);
      if (!ok) {
        throw new BadRequestException("Parolda kamida 1 ta maxsus belgi bo‘lishi kerak");
      }
    }
  }

  private async createSecurityLog(data: {
    userId: number | null;
    event: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
  }) {
    await this.prisma.securityLog.create({
      data: {
        userId: data.userId ?? null,
        event: data.event,
        success: data.success,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
        details: data.details,
      },
    }).catch(() => {});
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
