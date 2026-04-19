/**
 * Lightweight client-side hint only — backend may add structured flags later.
 * If any match, show crisis resources strip (not a clinical assessment).
 */
const PATTERNS = [
  /o['’]z\s+jon/i,
  /suicid/i,
  /o['’]ldirish/i,
  /o['’]ziga\s+zarar/i,
  /favqulodda/i,
  /xavfli\s+holat/i,
];

export function textMightIndicateCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return PATTERNS.some((p) => p.test(t));
}

export function interpretationMayNeedCrisisUi(parts: string[]): boolean {
  const joined = parts.join(' ');
  return textMightIndicateCrisis(joined);
}
