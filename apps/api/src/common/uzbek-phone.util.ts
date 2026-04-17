/** Mobil va superadmin bilan mos: barcha OTP / login / ro‘yxatdan o‘tishda bir xil E.164 (+998) format. */

export function normalizeUzbekPhoneE164(raw: string): string {
  const s = raw.trim().replace(/\s/g, '');
  if (/^\+998\d{9}$/.test(s)) return s;
  const d = s.replace(/\D/g, '');
  if (d.length === 9) return `+998${d}`;
  if (d.length === 12 && d.startsWith('998')) return `+${d}`;
  return s;
}

export function isValidUzbekMobileE164(phone: string): boolean {
  return /^\+998\d{9}$/.test(phone);
}
