import { Module } from '@nestjs/common';
import { MobileResourcesController } from './mobile-resources.controller';
import { MobileService } from './mobile.service';
import { MobileSosService } from './mobile-sos.service';
import { MobileAiPsychologistService } from './mobile-ai-psychologist.service';
import { PsychologistsModule } from '../psychologists/psychologists.module';
import { SystemModule } from '../system/system.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AuthModule } from '../auth/auth.module';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [PsychologistsModule, SystemModule, SessionsModule, AuthModule, CommunicationModule],
  controllers: [MobileResourcesController],
  providers: [MobileService, MobileSosService, MobileAiPsychologistService],
  exports: [MobileService],
})
export class MobileModule {}
