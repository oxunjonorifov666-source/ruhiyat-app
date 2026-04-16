import { apiClient } from './api';
import type { AuthUser } from './auth';

export type AppMetadata = {
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
  supportEmail: string | null;
  marketingTagline: string | null;
  helpCenterUrl: string | null;
};

export type NotificationPrefsPayload = {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  remindersEnabled?: boolean;
  marketingEnabled?: boolean;
  moodReminder?: boolean;
  sessionReminder?: boolean;
};

export const mobileAppService = {
  getAppMetadata() {
    return apiClient.get<AppMetadata>('/mobile/app-metadata');
  },

  registerPush(body: { expoPushToken: string; platform: string; deviceLabel?: string }) {
    return apiClient.post<{ ok: boolean }>('/mobile/push/register', body);
  },

  patchPreferences(body: {
    onboardingComplete?: boolean;
    notificationPrefs?: NotificationPrefsPayload;
    analyticsOptIn?: boolean;
    biometricEnabled?: boolean;
  }) {
    return apiClient.patch<{ user: AuthUser }>('/mobile/preferences', body);
  },
};
