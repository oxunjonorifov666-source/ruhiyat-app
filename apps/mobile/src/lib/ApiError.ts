/**
 * API xatoliklari — backend {@link ApiResponse} bilan mos.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly path?: string;

  constructor(message: string, status: number, code: string, path?: string | undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.path = path;
  }

  static isNetworkError(e: unknown): boolean {
    if (!(e instanceof Error)) return false;
    const m = e.message;
    return (
      m.includes('Network request failed') ||
      m.includes('Failed to fetch') ||
      m.includes('Tarmoq xatosi') ||
      m.includes('internet') ||
      m.includes('Internet')
    );
  }
}
