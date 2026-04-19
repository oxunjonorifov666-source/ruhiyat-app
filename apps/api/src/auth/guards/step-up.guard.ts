import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '@ruhiyat/types';
import { assertStepUpSatisfied, getStepUpSecret } from '../step-up.util';

/**
 * Requires a valid step-up token (HttpOnly cookie or `x-step-up-token`) issued after POST /auth/verify-password.
 * Run after JwtAuthGuard so `req.user` is set.
 */
@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user?.id) {
      return false;
    }
    assertStepUpSatisfied(req, user, getStepUpSecret(this.configService));
    return true;
  }
}
