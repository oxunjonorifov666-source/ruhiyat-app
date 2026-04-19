import { ForbiddenException } from '@nestjs/common';
import { AuthUser, UserRole } from '@ruhiyat/types';

/**
 * Tenant center on the principal: `Administrator` is the authoritative org binding when present;
 * otherwise the linked `Psychologist` profile supplies the center (panel users without an Admin row).
 * If both `centerId` values are set and differ, administrator wins.
 */
export function resolvePrincipalCenterId(
  administratorCenterId: number | null | undefined,
  psychologistCenterId: number | null | undefined,
): number | null {
  if (administratorCenterId != null) {
    return administratorCenterId;
  }
  if (psychologistCenterId != null) {
    return psychologistCenterId;
  }
  return null;
}

/**
 * Fail-closed: same-tenant only when both sides have a defined center; never allows null === null.
 */
export function assertSameCenterOrSuperadmin(
  requester: AuthUser,
  targetUserCenterId: number | null,
  forbiddenMessage = "Ushbu foydalanuvchi ma'lumotlarini ko'rishga ruxsatingiz yo'q",
): void {
  if (requester.role === UserRole.SUPERADMIN) {
    return;
  }
  const a = requester.centerId;
  if (a == null || targetUserCenterId == null) {
    throw new ForbiddenException(forbiddenMessage);
  }
  if (a !== targetUserCenterId) {
    throw new ForbiddenException(forbiddenMessage);
  }
}
