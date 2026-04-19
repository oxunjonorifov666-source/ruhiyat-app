import type { TestInterpretationV2 } from '~/types/assessments';

export function parseInterpretation(raw: string | null | undefined): TestInterpretationV2 | null {
  if (!raw || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as TestInterpretationV2;
    if (parsed && parsed.v === 2 && typeof parsed.headline === 'string') {
      return {
        ...parsed,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        attention: Array.isArray(parsed.attention) ? parsed.attention : [],
        selfCare: Array.isArray(parsed.selfCare) ? parsed.selfCare : [],
      };
    }
  } catch {
    /* plain text legacy */
  }
  return null;
}

/** When JSON parse fails, show raw interpretation as plain text (short). */
export function interpretationFallbackText(raw: string | null | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const parsed = parseInterpretation(raw);
  if (parsed) return null;
  return raw.trim().slice(0, 2000);
}
