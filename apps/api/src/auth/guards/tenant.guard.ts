import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthUser, UserRole } from '@ruhiyat/types';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    // 1. Check if user is authenticated (JwtAuthGuard should run before this)
    if (!user) {
      throw new ForbiddenException('Foydalanuvchi aniqlanmadi');
    }

    // 2. Allow Superadmin and Mobile User to access any center (or they don't have one)
    if (user.role === UserRole.SUPERADMIN || user.role === UserRole.MOBILE_USER) {
      return true;
    }

    // 3. Extract centerId from request params, query, or body
    const centerId = request.params.centerId || request.query.centerId || request.body.centerId;

    // 4. Validate if tenant context is missing for non-superadmin
    if (!user.centerId) {
      throw new ForbiddenException('Sizda ushbu ma\'lumotlarga kirish huquqi yo\'q (markaz tayinlanmagan)');
    }

    // 5. Enforce isolation: if centerId is provided, it MUST match the user's centerId
    if (centerId) {
      const targetCenterId = parseInt(centerId);
      if (!isNaN(targetCenterId) && targetCenterId !== user.centerId) {
        throw new ForbiddenException('Siz faqat o\'z markazingiz ma\'lumotlariga kirishingiz mumkin');
      }
    }

    return true;
  }
}
