import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
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
  VerifySessionPasswordDto,
  RequestProfilePhoneChangeDto,
  ConfirmProfilePhoneChangeDto,
} from './dto';
import type { Request } from 'express';
import {
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  clearStepUpCookie,
  readRefreshTokenFromRequest,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setStepUpCookie,
} from './auth-cookie.helper';
import { clearCsrfCookie, generateCsrfToken, setCsrfCookie } from './csrf-cookie.helper';
import { ttlToMs } from './auth-session.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private secureRefreshCookie(): boolean {
    return process.env.NODE_ENV === 'production' || process.env.ENFORCE_HTTPS === 'true';
  }

  private refreshCookieDomain(): string | undefined {
    const d = this.configService.get<string>('REFRESH_COOKIE_DOMAIN')?.trim();
    return d || undefined;
  }

  private setRefreshCookie(res: Response, refreshToken: string, refreshTtlMs: number) {
    setRefreshTokenCookie(
      res,
      refreshToken,
      refreshTtlMs,
      this.secureRefreshCookie(),
      this.refreshCookieDomain(),
    );
  }

  private clearRefreshCookie(res: Response) {
    clearRefreshTokenCookie(res, this.secureRefreshCookie(), this.refreshCookieDomain());
  }

  private setAccessCookie(res: Response, accessToken: string, accessTtlMs: number) {
    setAccessTokenCookie(res, accessToken, accessTtlMs, this.secureRefreshCookie(), this.refreshCookieDomain());
  }

  private clearAccessCookie(res: Response) {
    clearAccessTokenCookie(res, this.secureRefreshCookie(), this.refreshCookieDomain());
  }

  private setStepUpCookieRes(res: Response, token: string, ttlMs: number) {
    setStepUpCookie(res, token, ttlMs, this.secureRefreshCookie(), this.refreshCookieDomain());
  }

  private clearStepUpCookieRes(res: Response) {
    clearStepUpCookie(res, this.secureRefreshCookie(), this.refreshCookieDomain());
  }

  private setSessionCookies(
    res: Response,
    result: { accessToken: string; accessTtlMs: number; refreshToken: string; refreshTtlMs: number },
  ) {
    this.setAccessCookie(res, result.accessToken, result.accessTtlMs);
    this.setRefreshCookie(res, result.refreshToken, result.refreshTtlMs);
    setCsrfCookie(
      res,
      generateCsrfToken(),
      result.refreshTtlMs,
      this.secureRefreshCookie(),
      this.refreshCookieDomain(),
    );
  }

  private clearAllAuthCookies(res: Response) {
    this.clearAccessCookie(res);
    this.clearRefreshCookie(res);
    this.clearStepUpCookieRes(res);
    clearCsrfCookie(res, this.secureRefreshCookie(), this.refreshCookieDomain());
  }

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = (req.headers['user-agent'] as string) || undefined;
    const result = await this.authService.register({ ...dto, ipAddress, deviceInfo } as any);
    if (
      'accessToken' in result &&
      'accessTtlMs' in result &&
      'refreshToken' in result &&
      'refreshTtlMs' in result
    ) {
      this.setSessionCookies(res, result as { accessToken: string; accessTtlMs: number; refreshToken: string; refreshTtlMs: number });
    }
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = dto.ipAddress || (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = dto.deviceInfo || (req.headers['user-agent'] as string) || undefined;
    const result = await this.authService.login({ ...dto, ipAddress, deviceInfo });
    if (
      'accessToken' in result &&
      'accessTtlMs' in result &&
      'refreshToken' in result &&
      'refreshTtlMs' in result
    ) {
      this.setSessionCookies(res, result as { accessToken: string; accessTtlMs: number; refreshToken: string; refreshTtlMs: number });
    }
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async refresh(
    @Body() _dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readRefreshTokenFromRequest(req as any);
    if (!token) {
      throw new BadRequestException('Refresh token talab qilinadi');
    }
    const ipAddress = (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = (req.headers['user-agent'] as string) || undefined;
    const result = await this.authService.refreshTokens(token, { ipAddress, deviceInfo });
    this.setSessionCookies(res, result);
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async logout(
    @Body() _dto: LogoutDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readRefreshTokenFromRequest(req as any);
    if (!token) {
      throw new BadRequestException('Refresh token talab qilinadi');
    }
    const ipAddress = (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = (req.headers['user-agent'] as string) || undefined;
    this.clearAllAuthCookies(res);
    return this.authService.logout(token, { ipAddress, deviceInfo });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async getMe(@CurrentUser() currentUser: AuthUser) {
    const user = await this.authService.getAuthUserContext(currentUser.id);
    return { user };
  }

  /**
   * Issues or rotates the CSRF double-submit cookie for browser clients that have a valid
   * access session but no CSRF cookie yet (e.g. after deploying CSRF support).
   */
  @Get('csrf')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async issueCsrf(@Res({ passthrough: true }) res: Response) {
    const refreshTtlMs = ttlToMs(this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d');
    setCsrfCookie(
      res,
      generateCsrfToken(),
      refreshTtlMs,
      this.secureRefreshCookie(),
      this.refreshCookieDomain(),
    );
    return { ok: true };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async updateProfile(@CurrentUser() currentUser: AuthUser, @Body() dto: UpdateProfileDto) {
    const user = await this.authService.updateProfile(currentUser.id, dto);
    return { user };
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async verifySessionPassword(
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: VerifySessionPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifySessionPassword(currentUser.id, dto.password);
    if ('stepUpToken' in result && result.stepUpToken && 'stepUpTtlMs' in result) {
      this.setStepUpCookieRes(res, result.stepUpToken, (result as { stepUpTtlMs: number }).stepUpTtlMs);
    }
    return { ok: true };
  }

  @Post('profile/phone/request')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestProfilePhoneChange(@CurrentUser() currentUser: AuthUser, @Body() dto: RequestProfilePhoneChangeDto) {
    return this.authService.requestProfilePhoneChange(currentUser.id, dto.newPhone);
  }

  @Post('profile/phone/confirm')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async confirmProfilePhoneChange(@CurrentUser() currentUser: AuthUser, @Body() dto: ConfirmProfilePhoneChangeDto) {
    const user = await this.authService.confirmProfilePhoneChange(currentUser.id, dto.newPhone, dto.code);
    return { user };
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  async changePassword(
    @CurrentUser() currentUser: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.authService.changePassword(currentUser.id, dto);
    this.clearStepUpCookieRes(res);
    return out;
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
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = dto.ipAddress || (req.ip || (req.headers['x-forwarded-for'] as string) || '').toString();
    const deviceInfo = dto.deviceInfo || (req.headers['user-agent'] as string) || undefined;
    const result = await this.authService.verifyOtp({ ...dto, ipAddress, deviceInfo });
    if (
      result &&
      typeof result === 'object' &&
      'refreshToken' in result &&
      (result as { refreshToken?: string }).refreshToken &&
      'refreshTtlMs' in result &&
      'accessToken' in result &&
      'accessTtlMs' in result
    ) {
      const r = result as {
        accessToken: string;
        accessTtlMs: number;
        refreshToken: string;
        refreshTtlMs: number;
      };
      this.setSessionCookies(res, r);
    }
    return result;
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
