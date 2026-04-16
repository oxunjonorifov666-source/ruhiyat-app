import { apiClient } from './api';

export interface CommunityAuthor {
  id: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export interface CommunityPost {
  id: number;
  title: string | null;
  content: string;
  imageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  isPublished: boolean;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  author: CommunityAuthor;
  isLiked?: boolean;
}

export interface CommunityComment {
  id: number;
  postId: number;
  content: string;
  createdAt: string;
  author: CommunityAuthor;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const communityService = {
  async listPosts(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isPublished?: boolean;
    isFlagged?: boolean;
    authorId?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const isPublished =
      params?.isPublished === undefined ? 'true' : params.isPublished ? 'true' : 'false';
    return apiClient.get<PaginatedResponse<CommunityPost>>('/community/posts', {
      ...params,
      isPublished,
    } as any);
  },

  async createPost(data: { title?: string; content: string; imageUrl?: string }) {
    return apiClient.post<CommunityPost>('/community/posts', data);
  },

  async getComments(postId: number) {
    return apiClient.get<CommunityComment[]>(`/community/posts/${postId}/comments`);
  },

  async addComment(postId: number, data: { content: string }) {
    return apiClient.post<CommunityComment>(`/community/posts/${postId}/comments`, data);
  },

  async toggleLike(postId: number) {
    return apiClient.post<{ id: number; likesCount: number; isLiked: boolean }>(`/community/posts/${postId}/like`, {});
  },

  async reportPost(postId: number, data: { reason: string; details?: string }) {
    return apiClient.post<{ message: string; complaintId: number }>(`/community/posts/${postId}/report`, data);
  },
};

