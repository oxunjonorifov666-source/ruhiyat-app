import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { BlockingController } from './blocking.controller';
import { BlockingService } from './blocking.service';
import { ContentModerationController } from './content-moderation.controller';
import { ContentModerationService } from './content-moderation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ComplaintsController,
    ReportsController,
    BlockingController,
    ContentModerationController,
  ],
  providers: [
    ComplaintsService,
    ReportsService,
    BlockingService,
    ContentModerationService,
  ],
})
export class ModerationModule {}
