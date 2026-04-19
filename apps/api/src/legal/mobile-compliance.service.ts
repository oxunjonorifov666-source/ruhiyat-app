import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@ruhiyat/types';
import { LegalService } from './legal.service';
import { SecurityObservabilityService } from '../observability/security-observability.service';

@Injectable()
export class MobileComplianceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legal: LegalService,
    private readonly securityObs: SecurityObservabilityService,
  ) {}

  async getComplianceState(userId: number) {
    const [terms, privacy, mu] = await Promise.all([
      this.legal.getActiveDocument('TERMS_OF_SERVICE'),
      this.legal.getActiveDocument('PRIVACY_POLICY'),
      this.prisma.mobileUser.findUnique({
        where: { userId },
        select: {
          acceptedTermsVersion: true,
          acceptedPrivacyVersion: true,
          termsAcceptedAt: true,
          privacyAcceptedAt: true,
        },
      }),
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountLifecycle: true,
        deletionRequestedAt: true,
        scheduledDeletionAt: true,
      },
    });

    const graceDays = await this.legal.getDeletionGraceDays();

    return {
      activeTermsVersion: terms?.version ?? null,
      activePrivacyVersion: privacy?.version ?? null,
      acceptedTermsVersion: mu?.acceptedTermsVersion ?? null,
      acceptedPrivacyVersion: mu?.acceptedPrivacyVersion ?? null,
      termsAcceptedAt: mu?.termsAcceptedAt?.toISOString() ?? null,
      privacyAcceptedAt: mu?.privacyAcceptedAt?.toISOString() ?? null,
      accountLifecycle: user?.accountLifecycle ?? 'ACTIVE',
      deletionRequestedAt: user?.deletionRequestedAt?.toISOString() ?? null,
      scheduledDeletionAt: user?.scheduledDeletionAt?.toISOString() ?? null,
      deletionGraceDays: graceDays,
    };
  }

  async recordConsent(
    userId: number,
    body: { termsVersion: string; privacyVersion: string },
  ) {
    const terms = await this.legal.getActiveDocument('TERMS_OF_SERVICE');
    const privacy = await this.legal.getActiveDocument('PRIVACY_POLICY');
    if (!terms || !privacy) {
      throw new BadRequestException('Faol shartlar yoki maxfiylik hujjati sozlanmagan');
    }
    if (body.termsVersion.trim() !== terms.version.trim()) {
      throw new BadRequestException('Foydalanish shartlari versiyasi mos emas');
    }
    if (body.privacyVersion.trim() !== privacy.version.trim()) {
      throw new BadRequestException('Maxfiylik siyosati versiyasi mos emas');
    }

    const now = new Date();
    await this.prisma.mobileUser.upsert({
      where: { userId },
      create: {
        userId,
        acceptedTermsVersion: terms.version,
        acceptedPrivacyVersion: privacy.version,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      },
      update: {
        acceptedTermsVersion: terms.version,
        acceptedPrivacyVersion: privacy.version,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        centerId: null,
        action: 'CONSENT_RECORDED',
        resource: 'mobile.compliance',
        resourceId: userId,
        details: {
          termsVersion: terms.version,
          privacyVersion: privacy.version,
        },
      },
    });

    await this.securityObs.record({
      event: 'USER_CONSENT_RECORDED',
      userId,
      success: true,
      details: { termsVersion: terms.version, privacyVersion: privacy.version },
    });

    return { ok: true, termsVersion: terms.version, privacyVersion: privacy.version, acceptedAt: now.toISOString() };
  }

  async requestAccountDeletion(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accountLifecycle: true },
    });
    if (!user || user.role !== UserRole.MOBILE_USER) {
      throw new ForbiddenException('Bu operatsiya faqat mobil hisob uchun');
    }
    if (user.accountLifecycle === 'PENDING_DELETION') {
      throw new BadRequestException('Hisob o‘chirish allaqachon so‘ralgan');
    }
    if (user.accountLifecycle === 'DELETED') {
      throw new BadRequestException('Hisob allaqachon o‘chirilgan');
    }

    const graceDays = await this.legal.getDeletionGraceDays();
    const now = new Date();
    const scheduled = new Date(now.getTime() + graceDays * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          accountLifecycle: 'PENDING_DELETION',
          deletionRequestedAt: now,
          scheduledDeletionAt: scheduled,
        },
      }),
      this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    await this.prisma.auditLog.create({
      data: {
        userId,
        centerId: null,
        action: 'ACCOUNT_DELETION_REQUESTED',
        resource: 'user.account',
        resourceId: userId,
        details: {
          scheduledDeletionAt: scheduled.toISOString(),
          graceDays,
        },
      },
    });

    await this.securityObs.record({
      event: 'ACCOUNT_DELETION_REQUESTED',
      userId,
      success: true,
      details: { scheduledDeletionAt: scheduled.toISOString(), graceDays },
    });

    return {
      ok: true,
      deletionRequestedAt: now.toISOString(),
      scheduledDeletionAt: scheduled.toISOString(),
      graceDays,
    };
  }

  async cancelAccountDeletion(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, accountLifecycle: true },
    });
    if (!user || user.role !== UserRole.MOBILE_USER) {
      throw new ForbiddenException('Bu operatsiya faqat mobil hisob uchun');
    }
    if (user.accountLifecycle !== 'PENDING_DELETION') {
      throw new BadRequestException('Kutilayotgan o‘chirish arizasi yo‘q');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        accountLifecycle: 'ACTIVE',
        deletionRequestedAt: null,
        scheduledDeletionAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        centerId: null,
        action: 'ACCOUNT_DELETION_CANCELLED',
        resource: 'user.account',
        resourceId: userId,
        details: {},
      },
    });

    await this.securityObs.record({
      event: 'ACCOUNT_DELETION_CANCELLED',
      userId,
      success: true,
      details: {},
    });

    return { ok: true };
  }
}
