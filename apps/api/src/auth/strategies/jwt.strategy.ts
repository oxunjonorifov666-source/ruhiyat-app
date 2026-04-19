import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { getAccessJwtSecretForAuth } from '../../common/config/jwt-secrets.util';
import { AuthService } from '../auth.service';
import { ACCESS_COOKIE_NAME } from '../auth-cookie.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const c = req?.cookies?.[ACCESS_COOKIE_NAME];
          return typeof c === 'string' && c.length > 0 ? c : null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: getAccessJwtSecretForAuth(configService),
    });
  }

  async validate(payload: { sub: number; role?: string; cid?: number | null; pms?: string[] }) {
    if (payload.sub == null || typeof payload.sub !== 'number') {
      throw new UnauthorizedException('Invalid token subject');
    }
    return this.authService.resolvePrincipalForJwt(payload.sub);
  }
}
