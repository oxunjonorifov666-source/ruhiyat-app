/** Mirrors backend `Test` list/detail rows where relevant. */
export type TestListItem = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  type?: string;
  duration: number | null;
  imageUrl?: string | null;
  isPublished?: boolean;
  _count?: { questions: number; testResults: number };
};

export type TestsListResponse = {
  data: TestListItem[];
  total: number;
  page: number;
  limit: number;
};

export type AnswerDto = {
  id: number;
  text: string;
  score: number;
  orderIndex: number;
};

export type QuestionDto = {
  id: number;
  testId: number;
  text: string;
  type: string;
  orderIndex: number;
  answers: AnswerDto[];
};

export type SubmitTestBody = {
  score: number;
  maxScore: number;
  responses: Array<{ questionId: number; answerId: number; score: number }>;
  interpretation?: string;
};

export type SubmitTestResponse = {
  id: number;
  score: number | null;
  maxScore: number | null;
  interpretation: string | null;
  test?: { id: number; title: string; description?: string | null };
};

export type TestResultDetail = {
  id: number;
  score: number | null;
  maxScore: number | null;
  interpretation: string | null;
  completedAt: string | null;
  createdAt?: string;
  test: { id: number; title: string; description?: string | null };
};

/** Backend `test-interpretation.types` — stored JSON in `interpretation` field. */
export type TestInterpretationV2 = {
  v: 2;
  headline: string;
  summary: string;
  strengths: string[];
  attention: string[];
  selfCare: string[];
  closing: string;
  scorePercent: number;
};
