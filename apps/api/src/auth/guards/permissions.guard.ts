import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (user.role === 'SUPERADMIN') {
      return true;
    }

    const roleMap: Record<string, string> = {
      'ADMINISTRATOR': 'ADMIN',
      'MOBILE_USER': 'USER',
    };
    const roleName = roleMap[user.role] || user.role;

    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: true },
    });

    if (!role) {
      return false;
    }

    const userPermissions = role.permissions.map(p => `${p.resource}.${p.action}`);

    return requiredPermissions.every(rp => userPermissions.includes(rp));
  }
}
