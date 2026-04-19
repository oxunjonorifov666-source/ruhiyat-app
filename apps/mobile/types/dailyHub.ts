export type NotificationRow = {
  id: number;
  userId: number;
  title: string;
  body: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type Paginated<T> = { data: T[]; total: number; page: number; limit: number };

export type AnnouncementRow = {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
};

export type ArticleRow = {
  id: number;
  title: string;
  content: string;
  excerpt?: string | null;
  category?: string | null;
  isPublished?: boolean;
  createdAt: string;
};

export type MobileDashboardStats = {
  sessions: number;
  articles: number;
  days: number;
  savedArticles: number;
  testsCompleted: number;
  moodDays: number;
  diaryEntries: number;
};

export type MoodWeeklyResponse = {
  days: Array<{ date: string; label: string; value: number; count: number }>;
  weekAverage: number | null;
  trend: 'up' | 'down' | 'stable';
  loggedDays?: number;
  totalEntries?: number;
  aiSummary?: string;
  aiSource?: string;
};

export type SavedItemRow = {
  id: number;
  itemType: string;
  itemId: number;
  createdAt: string;
};

export type DiaryEntryRow = {
  id: number;
  title: string | null;
  content: string;
  mood: number | null;
  createdAt: string;
};

export type HabitRow = {
  id: number;
  name: string;
  description?: string | null;
  frequency?: string;
};

export type SleepRecordRow = {
  id: number;
  sleepStart: string;
  sleepEnd?: string | null;
  quality?: number | null;
  notes?: string | null;
  createdAt: string;
};

export type BreathingScenario = {
  id: number;
  title: string;
  description: string | null;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  cyclesDefault: number;
};
