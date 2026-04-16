import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '@ruhiyat/types';
import { MonetizationService } from './monetization.service';

@Controller('monetization')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class MonetizationController {
  constructor(private readonly service: MonetizationService) {}

  @Get('me/entitlements')
  getMyEntitlements(@CurrentUser() requester: AuthUser) {
    return this.service.getMyEntitlements(requester);
  }

  @Post('mobile/premium/start')
  startPremium(@CurrentUser() requester: AuthUser) {
    return this.service.startPremiumSubscription(requester);
  }

  @Post('mobile/premium/confirm')
  confirmPremiumPayment(
    @CurrentUser() requester: AuthUser,
    @Body() body: { paymentId: number },
  ) {
    return this.service.confirmMyPremiumPayment(requester, body.paymentId);
  }

  @Get('mobile/premium/payment-status/:paymentId')
  getPremiumPaymentStatus(
    @CurrentUser() requester: AuthUser,
    @Param('paymentId', ParseIntPipe) paymentId: number,
  ) {
    return this.service.getMyMobilePremiumPaymentStatus(requester, paymentId);
  }

  @Get('mobile/my-payments')
  listMyMobilePayments(@CurrentUser() requester: AuthUser) {
    return this.service.listMyMobilePayments(requester);
  }

  @Get('platform-settings')
  @Permissions('system.settings')
  getPlatform(@CurrentUser() requester: AuthUser) {
    return this.service.getPlatformSettings(requester);
  }

  @Patch('platform-settings')
  @Permissions('system.settings')
  patchPlatform(
    @CurrentUser() requester: AuthUser,
    @Body() body: { defaultCommissionPercent: number },
  ) {
    return this.service.updatePlatformSettings(requester, body);
  }

  @Get('my-center')
  @Permissions('finance.read')
  getMyCenter(@CurrentUser() requester: AuthUser) {
    return this.service.getMyCenterMonetization(requester);
  }

  @Get('center-tariffs')
  listCenterTariffs(@CurrentUser() requester: AuthUser) {
    return this.service.listCenterTariffs(requester);
  }

  @Put('center-tariffs')
  @Permissions('system.settings')
  upsertCenterTariff(
    @CurrentUser() requester: AuthUser,
    @Body()
    body: {
      tier: 'BASIC' | 'PRO' | 'PREMIUM';
      name: string;
      description?: string;
      maxUsers?: number | null;
      maxPsychologists?: number | null;
      featureFlags?: Record<string, boolean>;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.upsertCenterTariff(requester, body);
  }

  @Patch('centers/:centerId/tariff')
  @Permissions('system.settings')
  assignTariff(
    @CurrentUser() requester: AuthUser,
    @Param('centerId', ParseIntPipe) centerId: number,
    @Body() body: { tier: 'BASIC' | 'PRO' | 'PREMIUM' },
  ) {
    return this.service.assignCenterTariff(requester, centerId, body.tier);
  }

  @Get('consumer-plans')
  listConsumerPlans(@CurrentUser() requester: AuthUser) {
    return this.service.listConsumerPlans(requester);
  }

  @Put('consumer-plans')
  @Permissions('system.settings')
  upsertConsumerPlan(
    @CurrentUser() requester: AuthUser,
    @Body()
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
    return this.service.upsertConsumerPlan(requester, body);
  }

  @Get('superadmin/overview')
  @Permissions('system.settings')
  overview(@CurrentUser() requester: AuthUser) {
    return this.service.superadminOverview(requester);
  }
}
