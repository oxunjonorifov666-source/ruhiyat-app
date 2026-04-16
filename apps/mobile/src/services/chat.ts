import { apiClient } from './api';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TOKEN_KEYS } from '../config';

export interface ChatUser {
  id: number;
  email: string | null;
  phone?: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

export interface ChatParticipant {
  id: number;
  userId: number;
  user: ChatUser;
}

export interface ChatMessage {
  id: number;
  chatId: number;
  senderId: number;
  content: string | null;
  type: string;
  attachmentUrl: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email?: string | null;
  };
}

export interface Chat {
  id: number;
  type: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  lastMessage: ChatMessage | null;
  messageCount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export function getUserDisplayName(u?: { firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null }) {
  if (!u) return "Noma'lum";
  const full = `${u.firstName || ''} ${u.lastName || ''}`.trim();
  if (full) return full;
  return u.email || u.phone || 'Foydalanuvchi';
}

/** Qidiruv natijasi — direct chat boshlash uchun */
export interface ChatContact {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
}

export const chatService = {
  listMyChats(params?: { page?: number; limit?: number; search?: string }) {
    return apiClient.get<PaginatedResponse<Chat>>('/mobile/chats', params);
  },

  /** Email, telefon yoki ism bo‘yicha boshqa mobil foydalanuvchilar (min 2 belgi) */
  searchContacts(q: string) {
    return apiClient.get<ChatContact[]>('/mobile/contacts/search', { q });
  },

  createDirectChat(otherUserId: number) {
    return apiClient.post<Chat>('/mobile/chats/direct', { otherUserId });
  },

  /** To‘liq email bo‘yicha bitta foydalanuvchi topib, direct chat */
  createDirectChatByEmail(email: string) {
    return apiClient.post<Chat>('/mobile/chats/direct-by-email', { email });
  },

  ensureSupportChat() {
    return apiClient.post<Chat>('/mobile/chats/support', {});
  },
  listMyMessages(chatId: number, params?: { page?: number; limit?: number }) {
    return apiClient.get<PaginatedResponse<ChatMessage>>(`/mobile/chats/${chatId}/messages`, params);
  },
  async uploadChatAttachment(chatId: number, file: { uri: string; name: string; type: string }) {
    const token = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    if (!token) throw new Error('Sessiya tugadi');

    const form = new FormData();
    form.append('file', file as any);

    const res = await fetch(`${API_BASE_URL}/mobile/chats/${chatId}/attachments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({} as any));
      throw new Error(e.message || `Xatolik: ${res.status}`);
    }
    const data = await res.json();
    return data as { url: string };
  },
};

