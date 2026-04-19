import { apiClient } from './api';

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  avatarUrl: string | null;
  isPremium: boolean;
  gender: string | null;
  dateOfBirth: string | null;
  bio?: string | null;
  /** ISO — bazadan (`mobile_users.onboarding_completed_at`) */
  onboardingCompletedAt?: string | null;
  /** Bazadan JSON (`mobile_users.notification_prefs`) */
  notificationPrefs?: Record<string, unknown> | null;
  analyticsOptIn?: boolean;
  biometricEnabled?: boolean;
}



export const authService = {
  async loginWithEmail(email: string, password: string) {
    return apiClient.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/login',
      { email, password }
    );
  },

  async loginWithPhone(phone: string, password: string) {
    return apiClient.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/login',
      { phone, password }
    );
  },

  async register(data: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    password: string;
    code?: string;
  }) {
    return apiClient.post<{ accessToken: string; refreshToken: string; user: AuthUser }>(
      '/auth/register',
      data
    );
  },

  /** Ro‘yxatdan o‘tishdan oldin — telefon yoki emailga 6 raqamli kod */
  async sendRegistrationOtp(body: { phone?: string; email?: string }) {
    return apiClient.post<{ message: string; expiresAt?: string; devCode?: string }>('/auth/otp/send', {
      ...body,
      purpose: 'registration',
    });
  },

  async getProfile() {
    return apiClient.get<{ user: AuthUser }>('/auth/me');
  },

  async updateProfile(data: Partial<AuthUser> & { dateOfBirth?: string; bio?: string }) {
    const res = await apiClient.patch<{ user: AuthUser }>('/auth/profile', data);
    return res.user;
  },

  async logout(refreshToken: string) {
    return apiClient.post('/auth/logout', { refreshToken }).catch(() => {});
  },

  async requestPasswordReset(body: { email?: string; phone?: string }) {
    return apiClient.post<{ message: string }>('/auth/password/reset-request', body);
  },

  async verifyPasswordReset(body: { email?: string; phone?: string; code: string }) {
    return apiClient.post<{ message: string; resetToken: string; expiresInSec: number }>(
      '/auth/password/reset-verify',
      body
    );
  },

  async resetPassword(params: { resetToken: string; newPassword: string } | { token: string; newPassword: string }) {
    return apiClient.post<{ message: string }>('/auth/password/reset', params);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return apiClient.patch<{ message: string }>('/auth/password', { currentPassword, newPassword });
  },

  /** PIN qulfidan — hisob parolini tekshiradi, sessiya ochiq qoladi */
  async verifySessionPassword(password: string) {
    return apiClient.post<{ ok: boolean }>('/auth/verify-password', { password });
  },

  async sendLoginOtp(body: { phone?: string; email?: string }) {
    return apiClient.post<{ message: string; expiresAt?: string; devCode?: string }>('/auth/otp/send', {
      ...body,
      purpose: 'login',
    });
  },

  async verifyLoginOtp(body: { phone?: string; email?: string; code: string }) {
    return apiClient.post<{
      message: string;
      verified: boolean;
      user?: AuthUser;
      accessToken?: string;
      refreshToken?: string;
    }>('/auth/otp/verify', { ...body, purpose: 'login' });
  },

  async requestProfilePhoneChange(newPhone: string) {
    return apiClient.post<{ message: string; expiresAt?: string }>('/auth/profile/phone/request', { newPhone });
  },

  async confirmProfilePhoneChange(newPhone: string, code: string) {
    return apiClient.post<{ user: AuthUser }>('/auth/profile/phone/confirm', { newPhone, code });
  },
};

