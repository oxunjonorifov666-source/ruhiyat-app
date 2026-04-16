import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    private readonly auth: AuthService,
  ) {}

  async getDashboardStats(userId: number) {
    const [sessionsCount, savedArticles, testsCompleted, moodRows, diaryRows] = await Promise.all([
      this.prisma.bookingSession.count({ where: { userId } }),
      this.prisma.savedItem.count({ where: { userId, itemType: 'article' } }),
      this.prisma.testResult.count({ where: { userId } }),
      this.prisma.moodEntry.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
      this.prisma.diaryEntry.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 400,
      }),
    ]);

    const dayKeys = new Set<string>();
    const addDay = (d: Date) => {
      dayKeys.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    };
    moodRows.forEach((r) => addDay(new Date(r.createdAt)));
    diaryRows.forEach((r) => addDay(new Date(r.createdAt)));

    const streak = this.computeStreakDays(dayKeys);

    return {
      sessions: sessionsCount,
      /** `saved_items` da `article` turi */
      articles: savedArticles,
      /** Ketma-ket faol kunlar (kayfiyat yoki kundalik) */
      days: streak,
      savedArticles,
      testsCompleted,
      moodDays: moodRows.length,
      diaryEntries: diaryRows.length,
    };
  }

  private computeStreakDays(dayKeys: Set<string>): number {
    if (dayKeys.size === 0) return 0;
    const today = new Date();
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (dayKeys.has(key)) streak++;
      else if (i > 0) break;
    }
    return streak;
  }

  async listMyBookings(userId: number, query: { page?: number; limit?: number; status?: string }) {
    return this.sessions.findByUser(userId, query);
  }

  async createBooking(
    userId: number,
    body: { psychologistId: number; scheduledAt: string; duration?: number; notes?: string },
  ) {
    return this.sessions.create({
      userId,
      psychologistId: body.psychologistId,
      scheduledAt: body.scheduledAt,
      duration: body.duration,
      notes: body.notes,
    });
  }

  async setAvatarFromUpload(userId: number, publicPath: string) {
    const fullUrl = publicPath.startsWith('http') ? publicPath : publicPath;
    await this.auth.updateProfile(userId, { avatarUrl: fullUrl } as any);
    return this.auth.getAuthUserContext(userId);
  }

  /** Superadmin `mobile_app_settings` jadvalidan maxfiylik va aloqa havolalari */
  async getAppMetadataFromDb() {
    const keys = [
      'privacy_policy_url',
      'terms_of_service_url',
      'support_email',
      'app_marketing_tagline',
      'help_center_url',
    ];
    const rows = await this.prisma.mobileAppSetting.findMany({
      where: { key: { in: keys } },
    });
    const map: Record<string, string> = {};
    for (const r of rows) {
      if (r.value != null) map[r.key] = r.value;
    }
    return {
      privacyPolicyUrl: map.privacy_policy_url ?? null,
      termsOfServiceUrl: map.terms_of_service_url ?? null,
      supportEmail: map.support_email ?? null,
      marketingTagline: map.app_marketing_tagline ?? null,
      helpCenterUrl: map.help_center_url ?? null,
    };
  }

  async registerPushDevice(
    userId: number,
    body: { expoPushToken: string; platform: string; deviceLabel?: string },
  ) {
    const token = body.expoPushToken?.trim();
    if (!token) throw new BadRequestException('Push token kiritilmadi');
    await this.prisma.mobilePushDevice.upsert({
      where: {
        userId_expoPushToken: { userId, expoPushToken: token },
      },
      create: {
        userId,
        expoPushToken: token,
        platform: (body.platform || 'unknown').slice(0, 32),
        deviceLabel: body.deviceLabel?.slice(0, 120) || null,
      },
      update: {
        platform: (body.platform || 'unknown').slice(0, 32),
        deviceLabel: body.deviceLabel?.slice(0, 120) || null,
      },
    });
    return { ok: true };
  }

  async updateMobilePreferences(
    userId: number,
    data: {
      onboardingComplete?: boolean;
      notificationPrefs?: Record<string, unknown>;
      analyticsOptIn?: boolean;
      biometricEnabled?: boolean;
    },
  ) {
    const patch: Record<string, unknown> = {};
    if (data.onboardingComplete === true) {
      patch.onboardingCompletedAt = new Date();
    }
    if (data.notificationPrefs !== undefined) {
      patch.notificationPrefs = data.notificationPrefs;
    }
    if (data.analyticsOptIn !== undefined) {
      patch.analyticsOptIn = data.analyticsOptIn;
    }
    if (data.biometricEnabled !== undefined) {
      patch.biometricEnabled = data.biometricEnabled;
    }
    if (Object.keys(patch).length === 0) {
      return this.auth.getAuthUserContext(userId);
    }
    await this.prisma.mobileUser.update({
      where: { userId },
      data: patch as any,
    });
    return this.auth.getAuthUserContext(userId);
  }
}
