import { apiClient } from './api';

export interface MobilePsychologist {
  id: number;
  /** Psixolog bilan chat uchun User.id */
  userId?: number;
  firstName: string | null;
  lastName: string | null;
  specialization: string | null;
  bio: string | null;
  avatarUrl: string | null;
  rating: number | null;
  hourlyRate: number | null;
  sessionPrice: number | null;
  isAvailable: boolean;
}

export const mobilePublicService = {
  listPsychologists(params?: { page?: number; limit?: number; search?: string; specialization?: string }) {
    return apiClient.get<{ data: MobilePsychologist[]; total: number; page: number; limit: number }>(
      '/mobile/psychologists',
      params as Record<string, string | number | undefined>,
    );
  },

  /** Superadmin `mobile_app_settings` dagi AI Dilosh kalitsiz maydonlar */
  getAiDiloshConfig() {
    return apiClient.get<Record<string, string>>('/mobile/ai-config');
  },
};
