import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PsychologistsModule } from './psychologists/psychologists.module';
import { EducationCentersModule } from './education-centers/education-centers.module';
import { CoursesModule } from './courses/courses.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { CommunicationModule } from './communication/communication.module';
import { CommunityModule } from './community/community.module';
import { ContentModule } from './content/content.module';
import { MeetingsModule } from './meetings/meetings.module';
import { FinanceModule } from './finance/finance.module';
import { SystemModule } from './system/system.module';
import { WellnessModule } from './wellness/wellness.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PsychologistsModule,
    EducationCentersModule,
    CoursesModule,
    AssessmentsModule,
    CommunicationModule,
    CommunityModule,
    ContentModule,
    MeetingsModule,
    FinanceModule,
    SystemModule,
    WellnessModule,
  ],
})
export class AppModule {}
