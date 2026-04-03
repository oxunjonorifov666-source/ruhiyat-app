import { apiClient } from './api';

export interface AuthUser {
  id: number;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface OtpResponse {
  message: string;
  code?: string;
  verified?: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
}

export const authService = {
  async login(phone: string, password: string): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', { phone, password });
  },

  async register(data: { phone: string; firstName: string; lastName: string; password: string }): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/register', {
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
      role: 'MOBILE_USER',
    });
  },

  async sendOtp(phone: string, purpose: string): Promise<OtpResponse> {
    return apiClient.post<OtpResponse>('/auth/otp/send', { phone, purpose });
  },

  async verifyOtp(phone: string, code: string, purpose: string): Promise<OtpResponse> {
    return apiClient.post<OtpResponse>('/auth/otp/verify', { phone, code, purpose });
  },

  async getProfile(): Promise<{ user: AuthUser }> {
    return apiClient.get<{ user: AuthUser }>('/auth/me');
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch {}
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return apiClient.post('/auth/password/reset-request', { email });
  },
};
