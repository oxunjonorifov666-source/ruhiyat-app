import { apiClient } from './api';

export interface AppNotification {
  id: number;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  metadata: string | null;
  createdAt: string;
}

export const notificationsService = {
  list(params?: { page?: number; limit?: number }) {
    return apiClient.get<{ data: AppNotification[]; total: number; page: number; limit: number }>(
      '/notifications',
      params as Record<string, string | number | undefined>,
    );
  },

  markRead(id: number) {
    return apiClient.patch<{ id: number; isRead: boolean }>(`/notifications/${id}/read`);
  },
};
