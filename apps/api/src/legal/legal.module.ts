import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ObservabilityModule } from '../observability/observability.module';
import { StepUpGuard } from '../auth/guards/step-up.guard';
import { LegalService } from './legal.service';
import { MobileComplianceService } from './mobile-compliance.service';
import { LegalAdminController } from './legal-admin.controller';
import { PublicLegalController } from './public-legal.controller';

@Module({
  imports: [PrismaModule, ObservabilityModule],
  controllers: [LegalAdminController, PublicLegalController],
  providers: [LegalService, MobileComplianceService, StepUpGuard],
  exports: [LegalService, MobileComplianceService],
})
export class LegalModule {}
