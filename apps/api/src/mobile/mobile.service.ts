import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { AuthService } from '../auth/auth.service';
import { LegalService } from '../legal/legal.service';

@Injectable()
export class MobileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    private readonly auth: AuthService,
    private readonly legal: LegalService,
  ) {}

  /** Kunlik AI tavsiyasi (mock + foydalanuvchi konteksti) — keyin LLM bilan almashtirish oson */
  async getDailyInsight(userId: number) {
    const [lastMood, stats] = await Promise.all([
      this.prisma.moodEntry.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { mood: true, createdAt: true },
      }),
      this.getDashboardStats(userId),
    ]);

    const moodScore = lastMood?.mood ?? null;
    const moodBand =
      moodScore == null ? 'neutral' : moodScore <= 2 ? 'low' : moodScore >= 4 ? 'high' : 'mid';

    const titles: Record<string, string> = {
      low: 'Bugun o‘zingizga biroz g‘amxo‘r bo‘ling',
      mid: 'Bugun muvozanatni saqlash — kuch',
      high: 'Ajoyib kayfiyat — energiyangizni saqlang',
      neutral: 'Kunlik ruhiy tavsiya',
    };

    const bodies: Record<string, string> = {
      low:
        'Qisqa nafas mashqi (4-4-6) yoki 5 daqiqalik tinch sayr kayfiyatingizni yengillashtirishi mumkin. Professional yordam kerak bo‘lsa, ilovadagi mutaxassislar ro‘yxatidan foydalaning.',
      mid:
        'Bugun kundalik yoki qisqa jurnal yozish — o‘ylaringizni tartibga solishga yordam beradi. Saqlangan maqolalaringiz: ' +
        String(stats.savedArticles) +
        ' ta.',
      high:
        'Yaxshi kayfiyat — ijobiy odatlarni mustahkamlash uchun ideal vaqt. Trening yoki audio darslarni bugun rejalashtiring.',
      neutral:
        'Kayfiyatingizni belgilab ko‘ring — shaxsiylashtirilgan tavsiyalar aniqroq bo‘ladi. Ketma-ket faol kunlar: ' +
        String(stats.days) +
        ' kun.',
    };

    const motivational =
      stats.days >= 7
        ? 'Siz allaqachon ' + stats.days + ' kun ketma-ket o‘z ustingizda ishlayapsiz — bu katta yutuq.'
        : 'Har kungi kichik qadamlar — barqaror o‘zgarish kaliti.';

    return {
      title: titles[moodBand],
      body: bodies[moodBand],
      motivational,
      moodScore,
      streakDays: stats.days,
      generatedAt: new Date().toISOString(),
    };
  }

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
    const legalBundle = await this.legal.getPublicLegalBundle('GLOBAL');

    return {
      privacyPolicyUrl: map.privacy_policy_url ?? null,
      termsOfServiceUrl: map.terms_of_service_url ?? null,
      supportEmail: map.support_email ?? null,
      marketingTagline: map.app_marketing_tagline ?? null,
      helpCenterUrl: map.help_center_url ?? null,
      /** CMS-backed legal (versions + inline content). URLs may still point to web copies. */
      legal: {
        activeTermsVersion: legalBundle.terms?.version ?? null,
        activePrivacyVersion: legalBundle.privacy?.version ?? null,
        aiDisclaimerPrimary: legalBundle.aiDisclaimer.primary || null,
        aiDisclaimerSecondary: legalBundle.aiDisclaimer.secondary || null,
        accountDeletionGraceDays: legalBundle.accountDeletionGraceDays,
      },
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
