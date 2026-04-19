const isDev = process.env.NODE_ENV !== 'production'

/** Ishlab chiqishda xatolarni ko‘rsatadi; production’da ichki tafsilotlarni yashiradi */
export function safeDevError(context: string, err: unknown): void {
  if (!isDev) return
  // eslint-disable-next-line no-console
  console.error(`[superadmin] ${context}`, err)
}
