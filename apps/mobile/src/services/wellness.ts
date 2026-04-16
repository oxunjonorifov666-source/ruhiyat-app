import { apiClient } from './api';

export interface MoodEntry {
  id: number;
  mood: number;
  note?: string | null;
  factors?: string[];
  createdAt: string;
}

export interface MoodWeeklySummary {
  days: Array<{ date: string; label: string; value: number; count: number }>;
  weekAverage: number | null;
  trend: 'up' | 'down' | 'stable';
  loggedDays: number;
  totalEntries: number;
  aiSummary: string;
  aiSource: 'openai' | 'heuristic';
}

export interface BreathingScenario {
  id: number;
  title: string;
  description: string | null;
  inhaleSec: number;
  holdSec: number;
  exhaleSec: number;
  cyclesDefault: number;
  orderIndex: number;
}

export interface Habit {
  id: number;
  name: string;
  description?: string | null;
  frequency: string;
  targetCount: number;
  color?: string | null;
  icon?: string | null;
  logs?: { id: number; completedAt: string }[];
}

export interface SleepRecord {
  id: number;
  sleepStart: string;
  sleepEnd?: string | null;
  quality?: number | null;
  notes?: string | null;
  createdAt: string;
}

export const wellnessService = {
  getMoodEntries() {
    return apiClient.get<MoodEntry[]>('/wellness/mood');
  },

  getMoodWeeklySummary() {
    return apiClient.get<MoodWeeklySummary>('/wellness/mood/weekly');
  },

  createMoodEntry(mood: string | number, note?: string) {
    return apiClient.post<MoodEntry>('/wellness/mood', { mood, note });
  },

  getDiaryEntries() {
    return apiClient.get<
      Array<{ id: number; content: string; title?: string | null; mood?: number | null; createdAt: string }>
    >('/wellness/diary');
  },

  createDiaryEntry(content: string, title?: string) {
    return apiClient.post('/wellness/diary', { content, title });
  },

  updateDiaryEntry(id: number, body: { content?: string; title?: string }) {
    return apiClient.patch(`/wellness/diary/${id}`, body);
  },

  removeDiaryEntry(id: number) {
    return apiClient.delete(`/wellness/diary/${id}`);
  },

  getBreathingScenarios() {
    return apiClient.get<BreathingScenario[]>('/wellness/breathing-scenarios');
  },

  getBreathingSessions() {
    return apiClient.get<any[]>('/wellness/breathing');
  },

  createBreathingSession(duration: number, technique: string) {
    return apiClient.post('/wellness/breathing', { duration, technique });
  },

  getHabits() {
    return apiClient.get<Habit[]>('/wellness/habits');
  },

  createHabit(body: { name: string; description?: string; frequency?: string; targetCount?: number; color?: string }) {
    return apiClient.post<Habit>('/wellness/habits', body);
  },

  logHabit(habitId: number, note?: string) {
    return apiClient.post(`/wellness/habits/${habitId}/log`, { note });
  },

  deleteHabit(id: number) {
    return apiClient.delete(`/wellness/habits/${id}`);
  },

  getSleepRecords() {
    return apiClient.get<SleepRecord[]>('/wellness/sleep');
  },

  createSleepRecord(body: { sleepStart: string; sleepEnd?: string; quality?: number; notes?: string }) {
    return apiClient.post<SleepRecord>('/wellness/sleep', body);
  },
};
