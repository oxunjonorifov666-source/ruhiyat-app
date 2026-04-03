import { Module } from '@nestjs/common';
import { EducationCentersController } from './education-centers.controller';
import { EducationCentersService } from './education-centers.service';

@Module({
  controllers: [EducationCentersController],
  providers: [EducationCentersService],
  exports: [EducationCentersService],
})
export class EducationCentersModule {}
