/** `next.config` dagi `basePath` bilan bir xil bo‘lishi kerak */
export const SUPERADMIN_BASE = '/superadmin'

export function saUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SUPERADMIN_BASE}${p}`
}
