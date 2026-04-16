import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConsumerSubscriptionStatus,
  PaymentKind,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonetizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private assertSuperadmin(requester: AuthUser) {
    if (requester.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Faqat superadmin');
    }
  }

  async getPlatformSettings(requester: AuthUser) {
    this.assertSuperadmin(requester);
    let row = await this.prisma.platformMonetizationSettings.findUnique({
      where: { id: 1 },
    });
    if (!row) {
      row = await this.prisma.platformMonetizationSettings.create({
        data: { id: 1, defaultCommissionPercent: 10 },
      });
    }
    return row;
  }

  async updatePlatformSettings(
    requester: AuthUser,
    data: { defaultCommissionPercent: number },
  ) {
    this.assertSuperadmin(requester);
    const pct = Math.min(100, Math.max(0, Math.round(data.defaultCommissionPercent)));
    return this.prisma.platformMonetizationSettings.upsert({
      where: { id: 1 },
      create: { id: 1, defaultCommissionPercent: pct },
      update: { defaultCommissionPercent: pct },
    });
  }

  async listCenterTariffs(requester: AuthUser) {
    if (
      requester.role !== 'SUPERADMIN' &&
      requester.role !== 'ADMINISTRATOR'
    ) {
      throw new ForbiddenException('Ruxsat yo‘q');
    }
    return this.prisma.centerTariffPlan.findMany({
      where: requester.role === 'SUPERADMIN' ? undefined : { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /** Markaz admini: joriy tarif va mavjud tariflar ro‘yxati */
  async getMyCenterMonetization(requester: AuthUser) {
    if (requester.role !== UserRole.ADMINISTRATOR) {
      throw new ForbiddenException('Faqat markaz administratori');
    }
    if (requester.centerId == null) {
      throw new ForbiddenException('Markaz tayinlanmagan');
    }
    const [center, availableTariffs] = await Promise.all([
      this.prisma.educationCenter.findUnique({
        where: { id: requester.centerId },
        include: {
          centerTariffPlan: true,
        },
      }),
      this.prisma.centerTariffPlan.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    if (!center) throw new NotFoundException('Markaz topilmadi');
    return { center, availableTariffs };
  }

  async upsertCenterTariff(
    requester: AuthUser,
    body: {
      tier: 'BASIC' | 'PRO' | 'PREMIUM';
      name: string;
      description?: string;
      maxUsers?: number | null;
      maxPsychologists?: number | null;
      featureFlags?: Prisma.InputJsonValue | null;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    this.assertSuperadmin(requester);
    return this.prisma.centerTariffPlan.upsert({
      where: { tier: body.tier },
      create: {
        tier: body.tier,
        name: body.name,
        description: body.description ?? null,
        maxUsers: body.maxUsers ?? null,
        maxPsychologists: body.maxPsychologists ?? null,
        featureFlags: body.featureFlags ?? Prisma.JsonNull,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
      update: {
        name: body.name,
        description: body.description ?? undefined,
        maxUsers: body.maxUsers,
        maxPsychologists: body.maxPsychologists,
        featureFlags:
          body.featureFlags === undefined
            ? undefined
            : body.featureFlags === null
              ? Prisma.JsonNull
              : body.featureFlags,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });
  }

  async assignCenterTariff(
    requester: AuthUser,
    centerId: number,
    tier: 'BASIC' | 'PRO' | 'PREMIUM',
  ) {
    this.assertSuperadmin(requester);
    const plan = await this.prisma.centerTariffPlan.findUnique({
      where: { tier },
    });
    if (!plan) throw new NotFoundException('Tarif topilmadi');
    return this.prisma.educationCenter.update({
      where: { id: centerId },
      data: {
        centerTariffPlanId: plan.id,
        subscriptionPlan: tier,
      },
      include: { centerTariffPlan: true },
    });
  }

  async listConsumerPlans(requester: AuthUser) {
    if (
      requester.role !== 'SUPERADMIN' &&
      requester.role !== 'ADMINISTRATOR' &&
      requester.role !== 'MOBILE_USER'
    ) {
      throw new ForbiddenException('Ruxsat yo‘q');
    }
    const where =
      requester.role === 'MOBILE_USER'
        ? { isActive: true }
        : undefined;
    return this.prisma.consumerPlan.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  async upsertConsumerPlan(
    requester: AuthUser,
    body: {
      code: string;
      name: string;
      description?: string;
      monthlyPriceUzs?: number;
      featurePsychChat?: boolean;
      featureVideoConsultation?: boolean;
      featureCourses?: boolean;
      featurePremiumContent?: boolean;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    this.assertSuperadmin(requester);
    return this.prisma.consumerPlan.upsert({
      where: { code: body.code },
      create: {
        code: body.code,
        name: body.name,
        description: body.description ?? null,
        monthlyPriceUzs: body.monthlyPriceUzs ?? 0,
        featurePsychChat: body.featurePsychChat ?? false,
        featureVideoConsultation: body.featureVideoConsultation ?? false,
        featureCourses: body.featureCourses ?? false,
        featurePremiumContent: body.featurePremiumContent ?? false,
        sortOrder: body.sortOrder ?? 0,
        isActive: body.isActive ?? true,
      },
      update: {
        name: body.name,
        description: body.description,
        monthlyPriceUzs: body.monthlyPriceUzs,
        featurePsychChat: body.featurePsychChat,
        featureVideoConsultation: body.featureVideoConsultation,
        featureCourses: body.featureCourses,
        featurePremiumContent: body.featurePremiumContent,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    });
  }

  /** Mobil: joriy huquqlar (freemium / premium) */
  async getMyEntitlements(requester: AuthUser) {
    if (requester.role !== 'MOBILE_USER') {
      throw new ForbiddenException('Faqat mobil foydalanuvchi');
    }
    const mu = await this.prisma.mobileUser.findUnique({
      where: { userId: requester.id },
      include: { consumerPlan: true },
    });
    const premiumPlan = await this.prisma.consumerPlan.findFirst({
      where: { code: 'PREMIUM', isActive: true },
    });
    const freePlan = await this.prisma.consumerPlan.findFirst({
      where: { code: 'FREE', isActive: true },
    });
    const now = new Date();
    const premiumActive = !!(mu?.premiumUntil && mu.premiumUntil > now);

    const effective = premiumActive && premiumPlan ? premiumPlan : freePlan;
    return {
      isPremium: premiumActive,
      premiumUntil: mu?.premiumUntil ?? null,
      planCode: effective?.code ?? 'FREE',
      features: effective
        ? {
            psychChat: effective.featurePsychChat,
            videoConsultation: effective.featureVideoConsultation,
            courses: effective.featureCourses,
            premiumContent: effective.featurePremiumContent,
          }
        : {
            psychChat: false,
            videoConsultation: false,
            courses: false,
            premiumContent: false,
          },
    };
  }

  /** Mobil: o‘z to‘lovlari (premium jarayoni kuzatish) */
  async listMyMobilePayments(requester: AuthUser) {
    if (requester.role !== UserRole.MOBILE_USER) {
      throw new ForbiddenException('Faqat mobil foydalanuvchi');
    }
    return this.prisma.payment.findMany({
      where: { userId: requester.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        currency: true,
        status: true,
        kind: true,
        description: true,
        createdAt: true,
      },
    });
  }

  /**
   * Qo‘lda tasdiqlash — faqat dev/staging yoki PAYMENT_ALLOW_MANUAL_CONFIRM=true bo‘lsa.
   * Productionda asosiy yo‘l: Click Shop prepare/complete webhook.
   */
  async confirmMyPremiumPayment(requester: AuthUser, paymentId: number) {
    if (requester.role !== UserRole.MOBILE_USER) {
      throw new ForbiddenException('Faqat mobil foydalanuvchi');
    }
    const allowManual =
      this.config.get<string>('PAYMENT_ALLOW_MANUAL_CONFIRM') === 'true' ||
      this.config.get<string>('NODE_ENV') !== 'production';
    if (!allowManual) {
      throw new ForbiddenException(
        'Qo‘lda tasdiqlash o‘chirilgan. To‘lov Click orqali avtomatik tasdiqlanadi.',
      );
    }
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: requester.id,
        kind: PaymentKind.MOBILE_PREMIUM,
      },
    });
    if (!payment) {
      throw new NotFoundException('To\'lov topilmadi');
    }
    return this.applySuccessfulMobilePremiumPayment(payment.id, {
      method: PaymentMethod.CARD,
    });
  }

  /** Click / boshqa shlyuzlar webhooklari uchun (idempotent). */
  async applySuccessfulMobilePremiumPayment(
    paymentId: number,
    opts: {
      provider?: string;
      providerPaymentId?: string;
      method?: PaymentMethod;
    } = {},
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.kind !== PaymentKind.MOBILE_PREMIUM) {
      throw new NotFoundException('To\'lov topilmadi');
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      const fresh = await this.prisma.payment.findUnique({ where: { id: paymentId } });
      return { message: 'Allaqachon tasdiqlangan', payment: fresh, alreadyCompleted: true as const };
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Bu to\'lov allaqachon qayta ishlangan');
    }

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.COMPLETED,
        provider: opts.provider ?? undefined,
        providerPaymentId: opts.providerPaymentId ?? undefined,
        method: opts.method ?? PaymentMethod.CARD,
      },
    });
    await this.applyPlatformFeeOnPaymentCompleted(paymentId);
    const fresh = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    return { message: 'To\'lov tasdiqlandi', payment: fresh };
  }

  async failMobilePremiumPayment(paymentId: number, note?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.kind !== PaymentKind.MOBILE_PREMIUM) return;
    if (payment.status !== PaymentStatus.PENDING) return;

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.FAILED,
        metadata: note ? JSON.stringify({ failNote: note }) : undefined,
      },
    });

    const sub = await this.prisma.consumerSubscription.findFirst({
      where: { paymentId },
    });
    if (sub && sub.status === ConsumerSubscriptionStatus.PENDING) {
      await this.prisma.consumerSubscription.update({
        where: { id: sub.id },
        data: { status: ConsumerSubscriptionStatus.CANCELLED },
      });
    }
  }

  /** Mobil: premium obuna boshlash (to‘lov yaratiladi, tasdiqlash Click webhook yoki qo‘lda) */
  async startPremiumSubscription(requester: AuthUser) {
    if (requester.role !== 'MOBILE_USER') {
      throw new ForbiddenException('Faqat mobil foydalanuvchi');
    }
    const plan = await this.prisma.consumerPlan.findFirst({
      where: { code: 'PREMIUM', isActive: true },
    });
    if (!plan) throw new NotFoundException('PREMIUM rejasi topilmadi');

    const payment = await this.prisma.payment.create({
      data: {
        userId: requester.id,
        amount: plan.monthlyPriceUzs,
        currency: 'UZS',
        status: PaymentStatus.PENDING,
        kind: PaymentKind.MOBILE_PREMIUM,
        description: `Mobil Premium obuna: ${plan.name}`,
      },
    });

    const sub = await this.prisma.consumerSubscription.create({
      data: {
        userId: requester.id,
        consumerPlanId: plan.id,
        status: ConsumerSubscriptionStatus.PENDING,
        paymentId: payment.id,
      },
    });

    const merchantTransId = `mp-${payment.id}`;
    const clickMerchantId = this.config.get<string>('CLICK_MERCHANT_ID');
    const clickServiceId = this.config.get<string>('CLICK_SERVICE_ID');
    let checkoutUrl: string | null = null;
    if (clickMerchantId && clickServiceId) {
      const returnUrl = encodeURIComponent(
        this.config.get<string>('CLICK_RETURN_URL') || 'ruhiyat://payment-return',
      );
      const amt = payment.amount;
      checkoutUrl = `https://my.click.uz/services/pay/?service_id=${encodeURIComponent(clickServiceId)}&merchant_id=${encodeURIComponent(clickMerchantId)}&amount=${encodeURIComponent(String(amt))}&transaction_param=${encodeURIComponent(merchantTransId)}&return_url=${returnUrl}`;
    }

    return {
      payment,
      subscription: sub,
      amount: plan.monthlyPriceUzs,
      merchantTransId,
      checkoutUrl,
    };
  }

  /** Mobil: to‘lov holatini polling (Click dan qaytgach) */
  async getMyMobilePremiumPaymentStatus(requester: AuthUser, paymentId: number) {
    if (requester.role !== UserRole.MOBILE_USER) {
      throw new ForbiddenException('Faqat mobil foydalanuvchi');
    }
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: requester.id,
        kind: PaymentKind.MOBILE_PREMIUM,
      },
    });
    if (!payment) {
      throw new NotFoundException('To\'lov topilmadi');
    }
    const ent = await this.getMyEntitlements(requester);
    return {
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
      },
      isPremium: ent.isPremium,
    };
  }

  async superadminOverview(requester: AuthUser) {
    this.assertSuperadmin(requester);
    const settings = await this.getPlatformSettings(requester);
    const [payAgg, feeSum, subsActive, centers] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.COMPLETED },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.COMPLETED,
          platformFeeAmount: { not: null },
        },
        _sum: { platformFeeAmount: true },
      }),
      this.prisma.consumerSubscription.count({
        where: { status: ConsumerSubscriptionStatus.ACTIVE },
      }),
      this.prisma.educationCenter.count(),
    ]);

    return {
      defaultCommissionPercent: settings.defaultCommissionPercent,
      totalCompletedPayments: payAgg._count,
      totalGrossRevenue: payAgg._sum.amount ?? 0,
      totalPlatformFees: feeSum._sum.platformFeeAmount ?? 0,
      activeMobileSubscriptions: subsActive,
      educationCenters: centers,
    };
  }

  /**
   * To‘lov COMPLETED bo‘lganda platforma komissiyasini hisoblash va tranzaksiya yozish.
   */
  async applyPlatformFeeOnPaymentCompleted(paymentId: number): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status !== PaymentStatus.COMPLETED) return;
    if (payment.platformFeeAmount != null && payment.platformFeeAmount > 0) return;

    const settings = await this.prisma.platformMonetizationSettings.findUnique({
      where: { id: 1 },
    });
    const pct = settings?.defaultCommissionPercent ?? 10;
    const fee = Math.floor((payment.amount * pct) / 100);
    const net = Math.max(0, payment.amount - fee);

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          platformFeePercent: pct,
          platformFeeAmount: fee,
          netAmount: net,
        },
      }),
      this.prisma.transaction.create({
        data: {
          userId: payment.userId,
          centerId: payment.centerId,
          paymentId: payment.id,
          type: TransactionType.COMMISSION,
          status: TransactionStatus.COMPLETED,
          amount: fee,
          currency: payment.currency,
          description: `Platform komissiyasi ${pct}%`,
        },
      }),
    ]);

    if (payment.kind === PaymentKind.MOBILE_PREMIUM) {
      const sub = await this.prisma.consumerSubscription.findFirst({
        where: { paymentId: payment.id },
      });
      const end = new Date();
      end.setDate(end.getDate() + 30);
      if (sub) {
        await this.prisma.consumerSubscription.update({
          where: { id: sub.id },
          data: {
            status: ConsumerSubscriptionStatus.ACTIVE,
            startedAt: new Date(),
            currentPeriodEnd: end,
          },
        });
      }
      await this.prisma.mobileUser.updateMany({
        where: { userId: payment.userId },
        data: {
          isPremium: true,
          premiumUntil: end,
          consumerPlanId: (
            await this.prisma.consumerPlan.findFirst({
              where: { code: 'PREMIUM' },
            })
          )?.id,
        },
      });
    }
  }
}
