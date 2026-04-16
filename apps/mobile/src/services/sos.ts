import { apiClient } from './api';

export const sosService = {
  trigger(body: { latitude?: number; longitude?: number; message?: string }) {
    return apiClient.post<{ ok: boolean; alertId: number; createdAt: string }>('/mobile/sos', body);
  },
};
