import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ttlToMs } from './auth-session.util';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { StepUpGuard } from './guards/step-up.guard';
import { StepUpForPrivilegedUserFieldsGuard } from './guards/step-up-privileged-user-fields.guard';
import { DeliveryModule } from '../notifications/delivery.module';
import { LegalModule } from '../legal/legal.module';
import { getAccessJwtSecretForAuth } from '../common/config/jwt-secrets.util';

@Module({
  imports: [
    DeliveryModule,
    LegalModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = getAccessJwtSecretForAuth(config);
        const accessExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';
        return {
          secret,
          signOptions: { expiresIn: Math.max(1, Math.floor(ttlToMs(accessExpiresIn) / 1000)) },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    StepUpGuard,
    StepUpForPrivilegedUserFieldsGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    StepUpGuard,
    StepUpForPrivilegedUserFieldsGuard,
  ],
})
export class AuthModule {}
