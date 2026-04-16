/** API `test_results.interpretation` — JSON (`v:2`) yoki oddiy matn. */

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

export type ParsedTestInterpretation =
  | { kind: 'v2'; data: TestInterpretationV2 }
  | { kind: 'plain'; text: string }
  | { kind: 'empty' };

export function parseStoredInterpretation(raw: string | null | undefined): ParsedTestInterpretation {
  if (raw == null || !String(raw).trim()) {
    return { kind: 'empty' };
  }
  const t = String(raw).trim();
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t) as Partial<TestInterpretationV2> & { v?: number };
      if (
        j &&
        j.v === 2 &&
        typeof j.summary === 'string' &&
        Array.isArray(j.strengths) &&
        Array.isArray(j.attention) &&
        Array.isArray(j.selfCare)
      ) {
        return {
          kind: 'v2',
          data: {
            v: 2,
            headline: String(j.headline || 'Test natijasi'),
            summary: j.summary,
            strengths: j.strengths.map((x) => String(x)),
            attention: j.attention.map((x) => String(x)),
            selfCare: j.selfCare.map((x) => String(x)),
            closing: String(j.closing || ''),
            scorePercent: typeof j.scorePercent === 'number' ? j.scorePercent : 0,
          },
        };
      }
    } catch {
      /* oddiy matn */
    }
  }
  return { kind: 'plain', text: t };
}
