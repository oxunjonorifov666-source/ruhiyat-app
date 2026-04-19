import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser, UserRole } from '@ruhiyat/types';
import { SecurityObservabilityService } from '../../observability/security-observability.service';
import { SecurityAnomalyTrackerService } from '../../observability/security-anomaly-tracker.service';
import { SECURITY_EVENT_NAME } from '../../observability/security-event.model';
import { TENANT_ALLOW_MOBILE_KEY } from '../decorators/tenant-allow-mobile.decorator';

/**
 * Markaz (tenant) izolyatsiyasi — sukut bo‘yicha yopiq (fail-closed).
 * - SUPERADMIN: cheklovsiz.
 * - MOBILE_USER: faqat `@TenantAllowMobileUser()` belgilangan marshrutlarda (global emas).
 * - ADMINISTRATOR: centerId majburiy; mos kelmasa 403; yo‘q bo‘lsa injeksiya.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly securityObs: SecurityObservabilityService,
    private readonly anomalyTracker: SecurityAnomalyTrackerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser = request.user;

    if (!user) {
      throw new ForbiddenException('Foydalanuvchi aniqlanmadi');
    }

    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    if (user.role === UserRole.MOBILE_USER) {
      const allowMobile = this.reflector.getAllAndOverride<boolean>(TENANT_ALLOW_MOBILE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      if (allowMobile === true) {
        return true;
      }
      throw new ForbiddenException(
        'Ushbu marshrut markaz konteksti talab qiladi; mobil ilova faqat ruxsat etilgan endpointlar uchun',
      );
    }

    if (user.role !== UserRole.ADMINISTRATOR) {
      throw new ForbiddenException('Ushbu resurs uchun markaz administratori yoki superadmin talab qilinadi');
    }

    if (!user.centerId) {
      throw new ForbiddenException("Sizda ushbu ma'lumotlarga kirish huquqi yo'q (markaz tayinlanmagan)");
    }

    const rawCenter =
      request.params?.centerId ?? request.query?.centerId ?? request.body?.centerId;
    const parsed =
      rawCenter !== undefined && rawCenter !== null && rawCenter !== ''
        ? parseInt(String(rawCenter), 10)
        : NaN;

    if (!Number.isNaN(parsed) && parsed !== user.centerId) {
      this.anomalyTracker.observeTenantScopeViolation(user.id, String(request.url || ''));
      void this.securityObs.record({
        event: 'TENANT_SCOPE_VIOLATION',
        userId: user.id,
        success: false,
        event_name: SECURITY_EVENT_NAME.TENANT_SCOPE_VIOLATION,
        severity: 'high',
        category: 'tenant',
        details: {
          actorRole: user.role,
          boundCenterId: user.centerId,
          attemptedCenterId: parsed,
          path: String(request.url || '').split('?')[0],
          method: request.method,
        },
      });
      throw new ForbiddenException("Siz faqat o'z markazingiz ma'lumotlariga kirishingiz mumkin");
    }

    request.tenantId = user.centerId;
    request.tenantScope = { centerId: user.centerId };

    if (!request.query) {
      request.query = {};
    }
    if (request.query.centerId === undefined || request.query.centerId === '') {
      request.query.centerId = String(user.centerId);
    }

    if (['POST', 'PATCH', 'PUT'].includes(request.method)) {
      if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
        request.body = { ...(request.body && typeof request.body === 'object' ? request.body : {}), centerId: user.centerId };
      } else if (request.body.centerId === undefined || request.body.centerId === null) {
        request.body.centerId = user.centerId;
      }
    }

    return true;
  }
}
