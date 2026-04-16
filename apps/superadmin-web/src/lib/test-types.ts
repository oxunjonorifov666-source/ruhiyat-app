export interface CreateAnswerDto {
  text: string;
  isCorrect?: boolean;
  score?: number;
  orderIndex?: number;
}

export interface CreateQuestionDto {
  text: string;
  type?: string;
  orderIndex?: number;
  imageUrl?: string;
  answers: CreateAnswerDto[];
}

export interface CreateTestDto {
  title: string;
  description?: string;
  category?: string;
  type?: string;
  duration?: number;
  imageUrl?: string;
  isPublished?: boolean;
  questions: CreateQuestionDto[];
}

export interface TestResult {
  id: number;
  testId: number;
  userId: number;
  score: number | null;
  maxScore: number | null;
  completedAt: string;
  test: {
    title: string;
    category: string | null;
  };
}
