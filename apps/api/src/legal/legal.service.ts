import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountLifecycle, LegalDocumentKind, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { SecurityObservabilityService } from '../observability/security-observability.service';
import { SecurityAnomalyTrackerService } from '../observability/security-anomaly-tracker.service';

const AI_DISCLAIMER_PRIMARY_KEY = 'legal_ai_disclaimer_primary';
const AI_DISCLAIMER_SECONDARY_KEY = 'legal_ai_disclaimer_secondary';
const DELETION_GRACE_DAYS_KEY = 'account.deletion_grace_days';

@Injectable()
export class LegalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityObs: SecurityObservabilityService,
    private readonly anomalyTracker: SecurityAnomalyTrackerService,
  ) {}

  async listDocuments(kind?: LegalDocumentKind) {
    const where: Prisma.LegalDocumentWhereInput = {};
    if (kind) where.kind = kind;
    return this.prisma.legalDocument.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { publishedAt: 'desc' }, { id: 'desc' }],
    });
  }

  /**
   * Active legal doc versions, consent version histograms, grace period (superadmin / legal UI).
   */
  async getComplianceSummary(requester: AuthUser) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat superadmin');
    }
    const [termsActive, privacyActive, termsGroups, privacyGroups, totalMobile, withConsent, graceDays] =
      await Promise.all([
        this.getActiveDocument('TERMS_OF_SERVICE'),
        this.getActiveDocument('PRIVACY_POLICY'),
        this.prisma.mobileUser.groupBy({
          by: ['acceptedTermsVersion'],
          _count: { id: true },
        }),
        this.prisma.mobileUser.groupBy({
          by: ['acceptedPrivacyVersion'],
          _count: { id: true },
        }),
        this.prisma.mobileUser.count(),
        this.prisma.mobileUser.count({
          where: {
            OR: [{ termsAcceptedAt: { not: null } }, { privacyAcceptedAt: { not: null } }],
          },
        }),
        this.getDeletionGraceDays(),
      ]);
    return {
      activeTerms: termsActive
        ? {
            id: termsActive.id,
            version: termsActive.version,
            title: termsActive.title,
            publishedAt: termsActive.publishedAt?.toISOString() ?? null,
            updatedAt: termsActive.updatedAt.toISOString(),
          }
        : null,
      activePrivacy: privacyActive
        ? {
            id: privacyActive.id,
            version: privacyActive.version,
            title: privacyActive.title,
            publishedAt: privacyActive.publishedAt?.toISOString() ?? null,
            updatedAt: privacyActive.updatedAt.toISOString(),
          }
        : null,
      termsVersionCounts: termsGroups.map((g) => ({
        version: g.acceptedTermsVersion,
        count: g._count.id,
      })),
      privacyVersionCounts: privacyGroups.map((g) => ({
        version: g.acceptedPrivacyVersion,
        count: g._count.id,
      })),
      mobileUsersTotal: totalMobile,
      mobileWithAnyConsent: withConsent,
      deletionGraceDays: graceDays,
    };
  }

  /** Mobile users in `PENDING_DELETION` (queue for support review). */
  async listAccountDeletionQueue(requester: AuthUser) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('Faqat superadmin');
    }
    return this.prisma.user.findMany({
      where: { accountLifecycle: AccountLifecycle.PENDING_DELETION },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        accountLifecycle: true,
        deletionRequestedAt: true,
        scheduledDeletionAt: true,
        createdAt: true,
      },
      orderBy: [{ scheduledDeletionAt: 'asc' }, { id: 'asc' }],
      take: 200,
    });
  }

  async getActiveDocument(kind: LegalDocumentKind) {
    return this.prisma.legalDocument.findFirst({
      where: { kind, isActive: true },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async createDocument(
    requester: AuthUser,
    data: {
      kind: LegalDocumentKind;
      version: string;
      title?: string;
      content: string;
      publish?: boolean;
    },
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    const version = data.version.trim();
    if (!version) throw new BadRequestException('Versiya majburiy');

    const row = await this.prisma.legalDocument.create({
      data: {
        kind: data.kind,
        version,
        title: data.title?.trim() || null,
        content: data.content,
        isActive: !!data.publish,
        publishedAt: data.publish ? new Date() : null,
        createdById: requester.id,
      },
    });

    if (data.publish) {
      await this.deactivateOthers(row.kind, row.id);
    }

    await this.securityObs.record({
      event: 'LEGAL_DOCUMENT_CREATED',
      userId: requester.id,
      success: true,
      details: { kind: row.kind, version: row.version, published: !!data.publish },
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);

    return row;
  }

  async updateDocument(
    requester: AuthUser,
    id: number,
    data: { title?: string; content?: string },
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    const doc = await this.prisma.legalDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Hujjat topilmadi');

    const updated = await this.prisma.legalDocument.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        content: data.content !== undefined ? data.content : undefined,
      },
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);
    return updated;
  }

  async activateDocument(requester: AuthUser, id: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    const doc = await this.prisma.legalDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Hujjat topilmadi');

    await this.prisma.$transaction([
      this.prisma.legalDocument.updateMany({
        where: { kind: doc.kind, id: { not: id } },
        data: { isActive: false },
      }),
      this.prisma.legalDocument.update({
        where: { id },
        data: { isActive: true, publishedAt: doc.publishedAt ?? new Date() },
      }),
    ]);

    await this.securityObs.record({
      event: 'LEGAL_DOCUMENT_ACTIVATED',
      userId: requester.id,
      success: true,
      details: { kind: doc.kind, version: doc.version, id },
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);

    return this.prisma.legalDocument.findUnique({ where: { id } });
  }

  private async deactivateOthers(kind: LegalDocumentKind, exceptId: number) {
    await this.prisma.legalDocument.updateMany({
      where: { kind, id: { not: exceptId } },
      data: { isActive: false },
    });
  }

  async getPublicLegalBundle(regionCode?: string) {
    const region = (regionCode || 'GLOBAL').trim().toUpperCase() || 'GLOBAL';

    const [terms, privacy, crisisRegional, crisisGlobal, aiPrimary, aiSecondary, graceRow] =
      await Promise.all([
        this.getActiveDocument('TERMS_OF_SERVICE'),
        this.getActiveDocument('PRIVACY_POLICY'),
        this.prisma.crisisResource.findMany({
          where: { isActive: true, regionCode: region },
          orderBy: { sortOrder: 'asc' },
        }),
        region !== 'GLOBAL'
          ? this.prisma.crisisResource.findMany({
              where: { isActive: true, regionCode: 'GLOBAL' },
              orderBy: { sortOrder: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.mobileAppSetting.findUnique({ where: { key: AI_DISCLAIMER_PRIMARY_KEY } }),
        this.prisma.mobileAppSetting.findUnique({ where: { key: AI_DISCLAIMER_SECONDARY_KEY } }),
        this.prisma.systemSetting.findUnique({ where: { key: DELETION_GRACE_DAYS_KEY } }),
      ]);

    const crisis =
      crisisRegional.length > 0
        ? crisisRegional
        : crisisGlobal.length > 0
          ? crisisGlobal
          : await this.prisma.crisisResource.findMany({
              where: { isActive: true, regionCode: 'GLOBAL' },
              orderBy: { sortOrder: 'asc' },
            });

    const graceDays = Math.min(
      90,
      Math.max(1, parseInt((graceRow?.value as string) || '14', 10) || 14),
    );

    return {
      regionCode: region,
      terms: terms
        ? {
            version: terms.version,
            title: terms.title,
            content: terms.content,
            publishedAt: terms.publishedAt?.toISOString() ?? null,
          }
        : null,
      privacy: privacy
        ? {
            version: privacy.version,
            title: privacy.title,
            content: privacy.content,
            publishedAt: privacy.publishedAt?.toISOString() ?? null,
          }
        : null,
      aiDisclaimer: {
        primary: aiPrimary?.value ?? '',
        secondary: aiSecondary?.value ?? '',
      },
      crisis: {
        items: crisis.map((c) => ({
          id: c.id,
          label: c.label,
          phoneNumber: c.phoneNumber,
          helpText: c.helpText,
          regionCode: c.regionCode,
        })),
      },
      accountDeletionGraceDays: graceDays,
    };
  }

  async getAiSafetySettings() {
    const [primary, secondary] = await Promise.all([
      this.prisma.mobileAppSetting.findUnique({ where: { key: AI_DISCLAIMER_PRIMARY_KEY } }),
      this.prisma.mobileAppSetting.findUnique({ where: { key: AI_DISCLAIMER_SECONDARY_KEY } }),
    ]);
    return {
      primary: primary?.value ?? '',
      secondary: secondary?.value ?? '',
      keys: {
        primary: AI_DISCLAIMER_PRIMARY_KEY,
        secondary: AI_DISCLAIMER_SECONDARY_KEY,
      },
    };
  }

  async updateAiSafetySettings(requester: AuthUser, body: { primary?: string; secondary?: string }) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    const tasks: Promise<unknown>[] = [];
    if (body.primary !== undefined) {
      tasks.push(
        this.prisma.mobileAppSetting.upsert({
          where: { key: AI_DISCLAIMER_PRIMARY_KEY },
          update: { value: body.primary, updatedBy: requester.id },
          create: {
            key: AI_DISCLAIMER_PRIMARY_KEY,
            value: body.primary,
            platform: 'all',
            description: 'AI safety — primary disclaimer (mobile)',
            updatedBy: requester.id,
          },
        }),
      );
    }
    if (body.secondary !== undefined) {
      tasks.push(
        this.prisma.mobileAppSetting.upsert({
          where: { key: AI_DISCLAIMER_SECONDARY_KEY },
          update: { value: body.secondary, updatedBy: requester.id },
          create: {
            key: AI_DISCLAIMER_SECONDARY_KEY,
            value: body.secondary,
            platform: 'all',
            description: 'AI safety — secondary / limitations (mobile)',
            updatedBy: requester.id,
          },
        }),
      );
    }
    await Promise.all(tasks);
    await this.securityObs.record({
      event: 'AI_SAFETY_DISCLAIMER_UPDATED',
      userId: requester.id,
      success: true,
      details: {
        primaryLength: body.primary?.length ?? 0,
        secondaryLength: body.secondary?.length ?? 0,
      },
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);
    return this.getAiSafetySettings();
  }

  async listCrisisResources() {
    return this.prisma.crisisResource.findMany({
      orderBy: [{ regionCode: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async createCrisisResource(
    requester: AuthUser,
    data: {
      regionCode?: string;
      sortOrder?: number;
      label: string;
      phoneNumber?: string;
      helpText?: string;
      isActive?: boolean;
    },
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    const regionCode = (data.regionCode || 'GLOBAL').trim().toUpperCase() || 'GLOBAL';
    const created = await this.prisma.crisisResource.create({
      data: {
        regionCode,
        sortOrder: data.sortOrder ?? 0,
        label: data.label.trim(),
        phoneNumber: data.phoneNumber?.trim() || null,
        helpText: data.helpText?.trim() || null,
        isActive: data.isActive !== false,
      },
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);
    return created;
  }

  async updateCrisisResource(
    requester: AuthUser,
    id: number,
    data: {
      regionCode?: string;
      sortOrder?: number;
      label?: string;
      phoneNumber?: string;
      helpText?: string;
      isActive?: boolean;
    },
  ) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    const row = await this.prisma.crisisResource.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Topilmadi');

    const updatedCrisis = await this.prisma.crisisResource.update({
      where: { id },
      data: {
        regionCode:
          data.regionCode !== undefined
            ? data.regionCode.trim().toUpperCase() || 'GLOBAL'
            : undefined,
        sortOrder: data.sortOrder,
        label: data.label !== undefined ? data.label.trim() : undefined,
        phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber?.trim() || null : undefined,
        helpText: data.helpText !== undefined ? data.helpText?.trim() || null : undefined,
        isActive: data.isActive,
      },
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);
    return updatedCrisis;
  }

  async deleteCrisisResource(requester: AuthUser, id: number) {
    if (requester.role !== UserRole.SUPERADMIN) {
      throw new BadRequestException('Faqat superadmin');
    }
    await this.prisma.crisisResource.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Topilmadi');
    });
    this.anomalyTracker.observeSuperadminSensitiveMutation(requester.id);
    return { ok: true };
  }

  async getDeletionGraceDays(): Promise<number> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key: DELETION_GRACE_DAYS_KEY } });
    return Math.min(90, Math.max(1, parseInt((row?.value as string) || '14', 10) || 14));
  }

  /**
   * Revokes JWT/session access for deleted or past-due deletion accounts.
   * If grace period expired for PENDING_DELETION, performs anonymizing soft-delete.
   */
  async assertUserEligibleForAuth(userId: number): Promise<void> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        accountLifecycle: true,
        deletedAt: true,
        scheduledDeletionAt: true,
      },
    });
    if (!u) {
      throw new UnauthorizedException('Hisob topilmadi');
    }
    if (u.deletedAt || u.accountLifecycle === 'DELETED') {
      throw new UnauthorizedException('Hisob o‘chirilgan');
    }
    if (
      u.accountLifecycle === 'PENDING_DELETION' &&
      u.scheduledDeletionAt &&
      u.scheduledDeletionAt <= new Date()
    ) {
      await this.finalizeUserDeletion(userId);
      throw new UnauthorizedException('Hisob o‘chirilgan');
    }
  }

  async finalizeUserDeletion(userId: number) {
    const unique = `deleted+${userId}+${Date.now()}@deleted.ruhiyat.local`;
    await this.prisma.$transaction([
      this.prisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: unique,
          phone: null,
          passwordHash: null,
          firstName: 'Deleted',
          lastName: 'User',
          isActive: false,
          isVerified: false,
          accountLifecycle: 'DELETED',
          deletedAt: new Date(),
          scheduledDeletionAt: null,
          deletionRequestedAt: null,
        },
      }),
    ]);
    await this.securityObs.record({
      event: 'ACCOUNT_DELETION_FINALIZED',
      userId,
      success: true,
      details: { strategy: 'soft_anonymize' },
    });
  }
}
