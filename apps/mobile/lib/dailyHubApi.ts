import { api } from '~/lib/api';
import type {
  AnnouncementRow,
  ArticleRow,
  BreathingScenario,
  DiaryEntryRow,
  HabitRow,
  MobileDashboardStats,
  MoodWeeklyResponse,
  NotificationRow,
  Paginated,
  SavedItemRow,
  SleepRecordRow,
} from '~/types/dailyHub';

export async function fetchNotifications(params?: { page?: number; limit?: number }) {
  const { data } = await api.get<Paginated<NotificationRow>>('/notifications', { params });
  return data;
}

export async function markNotificationRead(id: number) {
  const { data } = await api.patch<NotificationRow>(`/notifications/${id}/read`);
  return data;
}

export async function fetchAnnouncements(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await api.get<Paginated<AnnouncementRow>>('/announcements', {
    params: { ...params, published: 'true' },
  });
  return data;
}

export async function fetchAnnouncementById(id: number) {
  const { data } = await api.get<AnnouncementRow>(`/announcements/${id}`);
  return data;
}

export async function fetchArticles(params?: { page?: number; limit?: number; search?: string }) {
  const { data } = await api.get<Paginated<ArticleRow>>('/articles', {
    params: { ...params, published: 'true' },
  });
  return data;
}

export async function fetchArticleById(id: number) {
  const { data } = await api.get<ArticleRow>(`/articles/${id}`);
  return data;
}

export async function fetchMobileDashboardStats() {
  const { data } = await api.get<MobileDashboardStats>('/mobile/stats');
  return data;
}

export async function fetchMoodWeeklySummary() {
  const { data } = await api.get<MoodWeeklyResponse>('/wellness/mood/weekly');
  return data;
}

export async function postMoodEntry(body: { mood: number; note?: string }) {
  const { data } = await api.post('/wellness/mood', body);
  return data;
}

export async function fetchBreathingScenarios() {
  const { data } = await api.get<BreathingScenario[]>('/wellness/breathing-scenarios');
  return data;
}

export async function fetchSavedItems() {
  const { data } = await api.get<SavedItemRow[]>('/wellness/saved-items');
  return data;
}

export async function fetchDiaryEntries() {
  const { data } = await api.get<DiaryEntryRow[]>('/wellness/diary');
  return data;
}

export async function fetchHabits() {
  const { data } = await api.get<HabitRow[]>('/wellness/habits');
  return data;
}

export async function fetchSleepRecords() {
  const { data } = await api.get<SleepRecordRow[]>('/wellness/sleep');
  return data;
}
