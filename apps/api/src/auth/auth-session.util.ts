import { UnauthorizedException } from '@nestjs/common';

/** Parse compact TTL like 15m, 24h, 7d into milliseconds. */
export function ttlToMs(expiresIn: string): number {
  const s = expiresIn.trim();
  const m = /^(\d+)([smhd])$/i.exec(s);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u === 's') return n * 1000;
  if (u === 'm') return n * 60 * 1000;
  if (u === 'h') return n * 60 * 60 * 1000;
  if (u === 'd') return n * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export function normalizeClientIp(ip: string | undefined): string {
  if (!ip) return '';
  return ip.split(',')[0].trim();
}

/**
 * Optional binding of refresh to original User-Agent / IP (enable via env in high-security deployments).
 */
export function assertRefreshSessionBinding(
  session: { ipAddress: string | null; deviceInfo: string | null },
  ctx: { ipAddress?: string; deviceInfo?: string },
  opts: { bindUa: boolean; bindIp: boolean },
): void {
  if (opts.bindUa && session.deviceInfo?.trim()) {
    const a = session.deviceInfo.trim();
    const b = (ctx?.deviceInfo || '').trim();
    if (!b || a !== b) {
      throw new UnauthorizedException('Sessiya konteksti mos kelmaydi (qurilma)');
    }
  }
  if (opts.bindIp && session.ipAddress?.trim()) {
    const a = normalizeClientIp(session.ipAddress);
    const b = normalizeClientIp(ctx?.ipAddress);
    if (!b || a !== b) {
      throw new UnauthorizedException('Sessiya konteksti mos kelmaydi (tarmoq)');
    }
  }
}
