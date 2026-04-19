import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined;
    const m = data?.message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.filter((x) => typeof x === 'string').join(', ');
  }
  if (error instanceof Error) return error.message;
  return 'Noma’lum xatolik';
}
