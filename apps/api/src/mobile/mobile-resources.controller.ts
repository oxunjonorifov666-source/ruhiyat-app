import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { PsychologistsService } from '../psychologists/psychologists.service';
import { SystemService } from '../system/system.service';
import { MobileService } from './mobile.service';
import { MobileSosService } from './mobile-sos.service';
import { MobileAiPsychologistService } from './mobile-ai-psychologist.service';
import { CommunicationService } from '../communication/communication.service';
import { MobileComplianceService } from '../legal/mobile-compliance.service';

@Controller('mobile')
@UseGuards(JwtAuthGuard)
export class MobileResourcesController {
  constructor(
    private readonly psychologists: PsychologistsService,
    private readonly system: SystemService,
    private readonly mobile: MobileService,
    private readonly sos: MobileSosService,
    private readonly aiPsych: MobileAiPsychologistService,
    private readonly communication: CommunicationService,
    private readonly compliance: MobileComplianceService,
  ) {}

  private ensureConsumer(user: AuthUser) {
    if (user.role !== UserRole.MOBILE_USER && user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Bu resurs faqat mobil foydalanuvchilar uchun');
    }
  }

  @Get('stats')
  dashboardStats(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.mobile.getDashboardStats(user.id);
  }

  @Get('psychologists')
  psychologistsDirectory(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('specialization') specialization?: string,
  ) {
    this.ensureConsumer(user);
    return this.psychologists.findMobileDirectory({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      specialization,
    });
  }

  @Get('psychologists/:id')
  psychologistDetail(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    this.ensureConsumer(user);
    return this.psychologists.findMobileById(id);
  }

  @Get('bookings')
  myBookings(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    this.ensureConsumer(user);
    return this.mobile.listMyBookings(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Post('bookings')
  createBooking(
    @CurrentUser() user: AuthUser,
    @Body() body: { psychologistId: number; scheduledAt: string; duration?: number; notes?: string },
  ) {
    this.ensureConsumer(user);
    if (!body?.psychologistId || !body?.scheduledAt) {
      throw new BadRequestException('psychologistId va scheduledAt majburiy');
    }
    return this.mobile.createBooking(user.id, body);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 4 * 1024 * 1024 },
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'avatars');
          try {
            mkdirSync(dir, { recursive: true });
            cb(null, dir);
          } catch (e) {
            cb(e as Error, dir);
          }
        },
        filename: (_req, file, cb) => {
          const ext = (file.originalname || '').split('.').pop()?.toLowerCase() || 'jpg';
          const safe = `av-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
          cb(null, safe);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype);
        cb(null, ok);
      },
    }),
  )
  async uploadAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    this.ensureConsumer(user);
    if (!file) throw new BadRequestException('Fayl tanlanmadi');
    const relative = `/uploads/avatars/${file.filename}`;
    const u = await this.mobile.setAvatarFromUpload(user.id, relative);
    return { user: u };
  }

  @Get('ai-config')
  aiDiloshPublicConfig(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.system.getPublicAiDiloshConfig();
  }

  @Post('sos')
  triggerSos(
    @CurrentUser() user: AuthUser,
    @Body() body: { latitude?: number; longitude?: number; message?: string },
  ) {
    this.ensureConsumer(user);
    return this.sos.triggerSos(user.id, body);
  }

  @Get('ai-psychologist/messages')
  aiPsychologistMessages(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.aiPsych.listMessages(user.id);
  }

  @Post('ai-psychologist/messages')
  aiPsychologistSend(@CurrentUser() user: AuthUser, @Body() body: { content: string }) {
    this.ensureConsumer(user);
    return this.aiPsych.sendMessage(user.id, body.content);
  }

  /** Superadmin `mobile_app_settings` — maxfiylik, qoidalar, aloqa */
  @Get('app-metadata')
  appMetadata(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.mobile.getAppMetadataFromDb();
  }

  /** Consent / deletion state vs active legal versions */
  @Get('compliance-state')
  complianceState(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.compliance.getComplianceState(user.id);
  }

  @Post('account/consent')
  recordConsent(
    @CurrentUser() user: AuthUser,
    @Body() body: { termsVersion: string; privacyVersion: string },
  ) {
    this.ensureConsumer(user);
    if (!body?.termsVersion?.trim() || !body?.privacyVersion?.trim()) {
      throw new BadRequestException('termsVersion va privacyVersion majburiy');
    }
    return this.compliance.recordConsent(user.id, body);
  }

  @Post('account/deletion-request')
  requestDeletion(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.compliance.requestAccountDeletion(user.id);
  }

  @Post('account/deletion-cancel')
  cancelDeletion(@CurrentUser() user: AuthUser) {
    this.ensureConsumer(user);
    return this.compliance.cancelAccountDeletion(user.id);
  }

  @Post('push/register')
  registerPush(
    @CurrentUser() user: AuthUser,
    @Body() body: { expoPushToken: string; platform: string; deviceLabel?: string },
  ) {
    this.ensureConsumer(user);
    return this.mobile.registerPushDevice(user.id, body);
  }

  @Patch('preferences')
  async patchPreferences(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      onboardingComplete?: boolean;
      notificationPrefs?: Record<string, unknown>;
      analyticsOptIn?: boolean;
      biometricEnabled?: boolean;
    },
  ) {
    this.ensureConsumer(user);
    const u = await this.mobile.updateMobilePreferences(user.id, body);
    return { user: u };
  }

  @Get('video/sessions')
  myVideoSessions(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    this.ensureConsumer(user);
    return this.communication.findVideoSessionsForMobileUser(user.id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('video/sessions/:id/join-token')
  videoJoinToken(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    this.ensureConsumer(user);
    return this.communication.getVideoJoinToken(id, { userId: user.id, role: user.role });
  }
}
