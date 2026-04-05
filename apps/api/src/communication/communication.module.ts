import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'ruhiyat-dev-secret-NOT-FOR-PRODUCTION',
      }),
    }),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, ChatGateway],
  exports: [CommunicationService, ChatGateway],
})
export class CommunicationModule {}
