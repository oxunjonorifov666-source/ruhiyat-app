import { apiClient } from './api';

export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  coverImageUrl?: string;
  category?: string | null;
  /** API may return excerpt (Prisma) */
  excerpt?: string;
  summary?: string;
  createdAt: string;
}

export interface AudioContent {
  id: number;
  title: string;
  fileUrl: string;
  coverImageUrl?: string;
  duration?: number;
  category?: string | null;
}

export interface VideoContent {
  id: number;
  title: string;
  fileUrl: string;
  thumbnailUrl?: string;
  duration?: number | null;
}

export interface Training {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  category?: string | null;
  duration?: number | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  difficulty?: string;
  isPublished?: boolean;
  createdAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const contentService = {
  /** Faol bannerlar (bazadagi `isActive` + muddat) */
  async getBanners() {
    return apiClient.get<Banner[]>('/banners', { activeOnly: 'true' });
  },

  async getArticles(opts?: { limit?: number; category?: string; search?: string; page?: number }) {
    const params: Record<string, string | number> = { published: 'true' };
    if (opts?.limit) params.limit = opts.limit;
    if (opts?.category) params.category = opts.category;
    if (opts?.search) params.search = opts.search;
    if (opts?.page) params.page = opts.page;
    return apiClient.get<PaginatedResponse<Article>>('/articles', params);
  },

  async getAudio() {
    return apiClient.get<PaginatedResponse<AudioContent>>('/audio', { published: 'true' });
  },

  async getVideos() {
    return apiClient.get<PaginatedResponse<VideoContent>>('/videos', { published: 'true' });
  },

  /** Chop etilgan treninglar (superadmin) */
  async getTrainings() {
    return apiClient.get<Training[]>('/trainings', { published: 'true' });
  },

  async getFeaturedArticles() {
    return apiClient.get<PaginatedResponse<Article>>('/articles', { published: 'true', limit: 5 });
  },

  async getArticle(id: number) {
    return apiClient.get<Article>(`/articles/${id}`);
  },
};

