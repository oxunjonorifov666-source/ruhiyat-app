import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      return false;
    }

    // SUPERADMIN has global bypass
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    // Permissions are resolved from the DB on each request (see AuthService.resolvePrincipalForJwt).
    const userPermissions = user.permissions || [];

    // O(1) Check for each required permission
    const hasPermission = requiredPermissions.every((rp) => 
      userPermissions.includes(rp) || userPermissions.includes('*')
    );

    if (!hasPermission) {
      throw new ForbiddenException('Sizga ushbu amalni bajarishga ruxsat berilmagan');
    }

    return true;
  }
}
