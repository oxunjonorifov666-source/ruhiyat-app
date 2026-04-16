export function normalizeUzbekPhone(raw: string): string {
  const s = raw.replace(/\s/g, '');
  if (/^\+998\d{9}$/.test(s)) return s;
  const d = raw.replace(/\D/g, '');
  if (d.length === 9) return `+998${d}`;
  if (d.length === 12 && d.startsWith('998')) return `+${d}`;
  return s;
}

export function isValidUzbekMobile(phone: string): boolean {
  return /^\+998\d{9}$/.test(phone);
}
