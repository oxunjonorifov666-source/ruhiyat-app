import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

@Module({
  imports: [ConfigModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
