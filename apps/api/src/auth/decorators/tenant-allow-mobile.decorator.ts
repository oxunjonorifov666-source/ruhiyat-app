import { SetMetadata } from '@nestjs/common';

/** TenantGuard metadata: faqat shu handler uchun MOBILE_USER o‘tkaziladi (masalan, monetization “me” yo‘llari) */
export const TENANT_ALLOW_MOBILE_KEY = 'tenantAllowMobile';

export const TenantAllowMobileUser = () => SetMetadata(TENANT_ALLOW_MOBILE_KEY, true);
