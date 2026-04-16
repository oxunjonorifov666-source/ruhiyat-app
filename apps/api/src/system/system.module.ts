import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { DashboardController } from './dashboard.controller';
import { AnalyticsController } from './analytics.controller';
import { ReportsController } from './reports.controller';
import { SuperadminOverviewService } from './superadmin-overview.service';

@Module({
  controllers: [SystemController, DashboardController, AnalyticsController, ReportsController],
  providers: [SystemService, SuperadminOverviewService],
  exports: [SystemService],
})
export class SystemModule {}
