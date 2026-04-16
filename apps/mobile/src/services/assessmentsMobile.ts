import { apiClient } from './api';

export interface QuestionDto {
  id: number;
  testId: number;
  text: string;
  type: string;
  orderIndex: number;
  answers: Array<{ id: number; text: string; score: number; orderIndex: number }>;
}

export const assessmentsMobileService = {
  getQuestions(testId: number) {
    return apiClient.get<QuestionDto[]>(`/assessments/tests/${testId}/questions`);
  },

  submitTest(
    testId: number,
    body: {
      score: number;
      maxScore: number;
      responses: unknown;
      interpretation?: string;
    },
  ) {
    return apiClient.post<{
      id: number;
      score: number | null;
      maxScore: number | null;
      interpretation: string | null;
      test?: { id: number; title: string; description?: string | null };
    }>(`/assessments/tests/${testId}/submit`, body);
  },

  getMyResults() {
    return apiClient.get<{
      data: Array<{
        id: number;
        score: number | null;
        maxScore: number | null;
        interpretation: string | null;
        createdAt: string;
        test: { id: number; title: string; description?: string | null };
      }>;
      total: number;
    }>('/assessments/test-results');
  },

  getTestResult(id: number) {
    return apiClient.get<{
      id: number;
      score: number | null;
      maxScore: number | null;
      interpretation: string | null;
      completedAt: string | null;
      test: { id: number; title: string; description?: string | null };
    }>(`/assessments/test-results/${id}`);
  },
};
