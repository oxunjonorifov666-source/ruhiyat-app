import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { ChatGateway } from './chat.gateway';
import { MobileChatController } from './mobile-chat.controller';
import { getAccessJwtSecretForAuth } from '../common/config/jwt-secrets.util';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: getAccessJwtSecretForAuth(config),
      }),
    }),
  ],
  controllers: [CommunicationController, MobileChatController],
  providers: [CommunicationService, ChatGateway],
  exports: [CommunicationService, ChatGateway],
})
export class CommunicationModule {}
