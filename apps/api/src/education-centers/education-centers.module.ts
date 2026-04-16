import { Module } from '@nestjs/common';
import { EducationCentersController } from './education-centers.controller';
import { EducationCentersService } from './education-centers.service';
import { StudentsController } from './students.controller';
import { TeachersController } from './teachers.controller';

@Module({
  controllers: [EducationCentersController, StudentsController, TeachersController],
  providers: [EducationCentersService],
  exports: [EducationCentersService],
})
export class EducationCentersModule {}
