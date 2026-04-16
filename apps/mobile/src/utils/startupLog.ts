/**
 * Ma’lumot — `console.log` (Expo LogBox qizil ekran bermasligi uchun).
 * Ogohlantirishlar — `console.warn`.
 */
export function startupLog(message: string, err?: unknown): void {
  const tag = "[Ruhiyat][startup]";
  if (err !== undefined) {
    const detail = err instanceof Error ? err.stack ?? err.message : String(err);
    console.warn(tag, message, detail);
  } else {
    console.log(tag, message);
  }
}
