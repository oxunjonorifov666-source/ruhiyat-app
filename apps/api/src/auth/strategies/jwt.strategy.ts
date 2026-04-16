import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'ruhiyat-dev-secret-NOT-FOR-PRODUCTION',
    });
  }

  async validate(payload: { sub: number; role: string; cid: number | null; pms: string[] }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or deactivated');
    }

    // Map payload back to AuthUser shape for request.user
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: payload.role as UserRole,
      centerId: payload.cid,
      permissions: payload.pms,
    };
  }
}
