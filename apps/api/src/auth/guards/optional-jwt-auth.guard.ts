import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Runs JWT validation when credentials are present (Bearer header or access cookie); on failure
 * or missing auth, allows the request through with no `user` (anonymous).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  override handleRequest<TUser>(err: unknown, user: TUser): TUser | undefined {
    if (err) return undefined;
    return user ?? undefined;
  }
}
