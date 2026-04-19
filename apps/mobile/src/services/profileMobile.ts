import * as SecureStore from 'expo-secure-store';
import { apiClient } from './api';
import { API_BASE_URL, TOKEN_KEYS } from '../config';
import type { AuthUser } from './auth';

export interface DashboardStats {
  sessions: number;
  articles: number;
  days: number;
  savedArticles: number;
  testsCompleted: number;
  moodDays: number;
  diaryEntries: number;
}

export interface BookingRow {
  id: number;
  scheduledAt: string;
  status: string;
  duration: number;
  price: number;
  psychologist: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    specialization: string | null;
    avatarUrl: string | null;
  };
}

export interface DailyInsightPayload {
  title: string;
  body: string;
  motivational: string;
  moodScore: number | null;
  streakDays: number;
  generatedAt: string;
}

export const profileMobileService = {
  async getStats() {
    return apiClient.get<DashboardStats>('/mobile/stats');
  },

  async getDailyInsight() {
    return apiClient.get<DailyInsightPayload>('/ai/daily-insight');
  },

  async getMyBookings(params?: { page?: number; limit?: number }) {
    return apiClient.get<{ data: BookingRow[]; total: number }>('/mobile/bookings', params as any);
  },

  async createBooking(body: { psychologistId: number; scheduledAt: string; duration?: number; notes?: string }) {
    return apiClient.post<BookingRow>('/mobile/bookings', body);
  },

  /** Multipart — `apiClient` dan tashqari */
  async uploadAvatar(localUri: string, mime: string, filename: string): Promise<AuthUser> {
    const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    if (!token) throw new Error('Sessiya tugadi');
    const form = new FormData();
    form.append('file', { uri: localUri, name: filename, type: mime } as any);
    const res = await fetch(`${API_BASE_URL}/mobile/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any).message || `Xatolik: ${res.status}`);
    }
    const json = (await res.json()) as { user?: AuthUser } | AuthUser;
    return 'user' in json && json.user ? json.user : (json as AuthUser);
  },
};
