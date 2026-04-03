import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [SystemController, DashboardController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
