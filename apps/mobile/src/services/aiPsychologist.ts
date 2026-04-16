import { apiClient } from './api';

export interface AiMessageRow {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

export const aiPsychologistService = {
  getMessages() {
    return apiClient.get<AiMessageRow[]>('/mobile/ai-psychologist/messages');
  },
  sendMessage(content: string) {
    return apiClient.post<{ userMessage: string; assistant: AiMessageRow }>('/mobile/ai-psychologist/messages', {
      content,
    });
  },
};
