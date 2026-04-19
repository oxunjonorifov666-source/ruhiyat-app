import { api } from '~/lib/api';
import type {
  QuestionDto,
  SubmitTestBody,
  SubmitTestResponse,
  TestListItem,
  TestsListResponse,
  TestResultDetail,
} from '~/types/assessments';

export async function fetchPublishedTests() {
  const { data } = await api.get<TestsListResponse>('/assessments/tests', {
    params: { published: 'true' },
  });
  return data;
}

export async function fetchTest(testId: number) {
  const { data } = await api.get<TestListItem & { _count?: { questions: number; testResults: number } }>(
    `/assessments/tests/${testId}`,
  );
  return data;
}

export async function fetchQuestions(testId: number) {
  const { data } = await api.get<QuestionDto[]>(`/assessments/tests/${testId}/questions`);
  return data;
}

export async function submitTest(testId: number, body: SubmitTestBody) {
  const { data } = await api.post<SubmitTestResponse>(`/assessments/tests/${testId}/submit`, body);
  return data;
}

export async function fetchTestResult(resultId: number) {
  const { data } = await api.get<TestResultDetail>(`/assessments/test-results/${resultId}`);
  return data;
}
