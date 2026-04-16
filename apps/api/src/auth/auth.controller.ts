import { Controller, Post, Get, Patch, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';
import {
  LoginDto,
  RegisterDto,
  SendOtpDto,
  VerifyOtpDto,
  RequestPasswordResetDto,
  VerifyPasswordResetOtpDto,
  ResetPasswordDto,
  RefreshTokenDto,
  LogoutDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = (req.headers['user-agent'] as string) || undefined;
    return this.authService.register({ ...dto, ipAddress, deviceInfo } as any);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = dto.ipAddress || (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = dto.deviceInfo || (req.headers['user-agent'] as string) || undefined;
    return this.authService.login({ ...dto, ipAddress, deviceInfo });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = (req.headers['user-agent'] as string) || undefined;
    return this.authService.refreshTokens(dto.refreshToken, { ipAddress, deviceInfo });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto, @Req() req: Request) {
    const ipAddress = (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = (req.headers['user-agent'] as string) || undefined;
    return this.authService.logout(dto.refreshToken, { ipAddress, deviceInfo });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async getMe(@CurrentUser() currentUser: AuthUser) {
    const user = await this.authService.getAuthUserContext(currentUser.id);
    return { user };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async updateProfile(@CurrentUser() currentUser: AuthUser, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.updateProfile(currentUser.id, dto);
    return { user };
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async changePassword(@CurrentUser() currentUser: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(currentUser.id, dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password/reset-verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verifyPasswordResetOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    return this.authService.verifyPasswordResetOtp(dto);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
