import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthUser } from '@ruhiyat/types';
import { assertStepUpSatisfied, getStepUpSecret } from '../step-up.util';

/**
 * On PATCH /users/:id, requires step-up only when `role` or `isActive` is in the body.
 */
@Injectable()
export class StepUpForPrivilegedUserFieldsGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    if (!user?.id) {
      return false;
    }
    const body = req.body as { role?: unknown; isActive?: unknown } | undefined;
    if (!body || (body.role === undefined && body.isActive === undefined)) {
      return true;
    }
    assertStepUpSatisfied(req, user, getStepUpSecret(this.configService));
    return true;
  }
}
