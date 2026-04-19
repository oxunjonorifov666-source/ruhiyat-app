import { getApiBaseUrl } from '~/lib/env';

/** Resolves `/uploads/...` paths to absolute URL (API origin without `/api`). */
export function resolvePublicAssetUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null;
  const p = path.trim();
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  const base = getApiBaseUrl().replace(/\/api$/, '');
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}
