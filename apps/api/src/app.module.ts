import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ObservabilityModule } from './observability/observability.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PsychologistsModule } from './psychologists/psychologists.module';
import { EducationCentersModule } from './education-centers/education-centers.module';
import { CoursesModule } from './courses/courses.module';
import { GroupsModule } from './groups/groups.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PaymentsModule } from './payments/payments.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { CommunicationModule } from './communication/communication.module';
import { CommunityModule } from './community/community.module';
import { ContentModule } from './content/content.module';
import { MeetingsModule } from './meetings/meetings.module';
import { FinanceModule } from './finance/finance.module';
import { SystemModule } from './system/system.module';
import { WellnessModule } from './wellness/wellness.module';
import { AdministratorsModule } from './administrators/administrators.module';
import { ModerationModule } from './moderation/moderation.module';
import { SessionsModule } from './sessions/sessions.module';
import { HealthModule } from './health/health.module';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { SecurityModule } from './security/security.module';
import { MonetizationModule } from './monetization/monetization.module';
import { MobileModule } from './mobile/mobile.module';
import { LegalModule } from './legal/legal.module';
import { ClickModule } from './integrations/click/click.module';
import { PushModule } from './push/push.module';
import { TenantGuard } from './auth/guards/tenant.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PushModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    ObservabilityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PsychologistsModule,
    EducationCentersModule,
    CoursesModule,
    GroupsModule,
    EnrollmentsModule,
    PaymentsModule,
    AssessmentsModule,
    CommunicationModule,
    CommunityModule,
    ContentModule,
    MeetingsModule,
    FinanceModule,
    SystemModule,
    WellnessModule,
    AdministratorsModule,
    ModerationModule,
    SessionsModule,
    SecurityModule,
    MonetizationModule,
    MobileModule,
    LegalModule,
    ClickModule,
  ],
  providers: [
    TenantGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
