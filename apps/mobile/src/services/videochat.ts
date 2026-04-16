import { apiClient } from './api';

export interface VideoSession {
  id: number;
  title: string;
  description: string | null;
  type: string;
  status: string;
  hostId: number;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const videochatService = {
  async listSessions(params?: { page?: number; limit?: number; status?: string }) {
    return apiClient.get<PaginatedResponse<VideoSession>>('/mobile/video/sessions', params);
  },

  async getJoinToken(id: number) {
    return apiClient.get<{ url: string; domain: string; roomId: string; token: string | null; displayName: string }>(
      `/mobile/video/sessions/${id}/join-token`,
    );
  },
};

