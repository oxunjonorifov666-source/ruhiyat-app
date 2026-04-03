import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(data: any) {
    const { email, phone, password, role } = data;

    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException('Email already registered');
    }

    if (phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone } });
      if (existing) throw new ConflictException('Phone already registered');
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: role || 'MOBILE_USER',
      },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return { user: { id: user.id, email: user.email, phone: user.phone, role: user.role }, ...tokens };
  }

  async login(data: any) {
    const { email, phone, password } = data;

    const user = email
      ? await this.prisma.user.findUnique({ where: { email } })
      : await this.prisma.user.findUnique({ where: { phone } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.role);
    await this.createSession(user.id, tokens.refreshToken);

    return { user: { id: user.id, email: user.email, phone: user.phone, role: user.role }, ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { refreshToken: tokenHash, isRevoked: false },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const tokens = await this.generateTokens(session.user.id, session.user.role);
    await this.createSession(session.user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshToken: tokenHash },
      data: { isRevoked: true },
    });
    return { message: 'Logged out successfully' };
  }

  async sendOtp(data: { phone?: string; email?: string; purpose: string }) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.prisma.otpVerification.create({
      data: {
        phone: data.phone,
        email: data.email,
        code,
        purpose: data.purpose,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    // TODO: Integrate SMS/email provider to send the OTP
    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(data: { phone?: string; email?: string; code: string; purpose: string }) {
    const where: any = { purpose: data.purpose, isUsed: false };
    if (data.phone) where.phone = data.phone;
    if (data.email) where.email = data.email;

    const otp = await this.prisma.otpVerification.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    if (otp.attempts >= 5) {
      throw new UnauthorizedException('Too many attempts');
    }

    if (otp.code !== data.code) {
      await this.prisma.otpVerification.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP code');
    }

    await this.prisma.otpVerification.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return { message: 'OTP verified successfully', verified: true };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent' };
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

    // TODO: Send password reset email
    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const otp = await this.prisma.otpVerification.findFirst({
      where: { code: token, purpose: 'password_reset', isUsed: false },
    });

    if (!otp || !otp.userId || otp.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
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

    return { message: 'Password reset successfully' };
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
