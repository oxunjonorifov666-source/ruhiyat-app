import type { QuestionDto, SubmitTestBody } from '~/types/assessments';

export function computeScores(questions: QuestionDto[], picked: Record<number, number>) {
  let score = 0;
  let maxScore = 0;
  const responses: SubmitTestBody['responses'] = [];
  for (const q of questions) {
    const aid = picked[q.id];
    const maxA = q.answers.length ? Math.max(0, ...q.answers.map((a) => a.score)) : 0;
    maxScore += maxA;
    const ans = aid ? q.answers.find((a) => a.id === aid) : undefined;
    const sc = ans?.score ?? 0;
    score += sc;
    if (aid) {
      responses.push({ questionId: q.id, answerId: aid, score: sc });
    }
  }
  return { score, maxScore, responses };
}

export function clientInterpretationHint(score: number, maxScore: number): string {
  return maxScore > 0 ? `Ball: ${score} / ${maxScore}.` : 'Test yakunlandi.';
}
