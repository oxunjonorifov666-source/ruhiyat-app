import { ApiHttpError } from '@/lib/api-http-error'

function apiMessageFromError(error: unknown): string {
  if (error instanceof ApiHttpError) {
    const b = error.body as { message?: string | string[] } | undefined
    if (Array.isArray(b?.message)) return b.message.join(' ')
    if (typeof b?.message === 'string') return b.message
  }
  if (error instanceof Error) return error.message
  return ''
}

export function isUserCancelledStepUp(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function isStepUpRequiredError(error: unknown): boolean {
  if (error instanceof ApiHttpError && error.statusCode === 403) {
    const msg = apiMessageFromError(error)
    return /qayta\s*tasdiqlash|tasdiqlash\s*talab|step-up/i.test(msg)
  }
  return false
}

export function isPermissionDeniedError(error: unknown): boolean {
  if (isStepUpRequiredError(error)) return false
  if (error instanceof ApiHttpError) {
    return error.statusCode === 403 || error.statusCode === 401
  }
  if (error instanceof Error) {
    return /\b403\b|401\b|Forbidden|Ruxsat|permission/i.test(error.message)
  }
  return false
}

export function classifyApiError(error: unknown): { message: string; permissionDenied: boolean } {
  return {
    message: error instanceof Error ? error.message : 'Xatolik yuz berdi',
    permissionDenied: isPermissionDeniedError(error),
  }
}

export function formatEmbeddedApiError(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Xatolik yuz berdi'
}

export function describeEmbeddedApiError(error: unknown): { title: string; description: string } {
  if (isStepUpRequiredError(error)) {
    return {
      title: 'Qayta tasdiqlash kerak',
      description: 'Parolingizni kiritib, amalni qayta bajaring.',
    }
  }
  return {
    title: 'Xatolik',
    description: error instanceof Error ? error.message : "So'rov bajarilmadi",
  }
}
