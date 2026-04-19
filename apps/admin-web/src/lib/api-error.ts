import { ApiHttpError } from "@/lib/api-client"

/** Extract Nest-style message string from API error body. */
function apiMessageFromError(error: unknown): string {
  if (error instanceof ApiHttpError) {
    const b = error.body as { message?: string | string[] } | undefined
    if (Array.isArray(b?.message)) return b.message.join(" ")
    if (typeof b?.message === "string") return b.message
  }
  if (error instanceof Error) return error.message
  return ""
}

/**
 * 403 Forbidden when step-up JWT/cookie is missing or invalid (not a role permission issue).
 */
export function isUserCancelledStepUp(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export function isStepUpRequiredError(error: unknown): boolean {
  if (error instanceof ApiHttpError && error.statusCode === 403) {
    const msg = apiMessageFromError(error)
    return /qayta\s*tasdiqlash|tasdiqlash\s*talab|step-up/i.test(msg)
  }
  return false
}

/** True when the server denied access (wrong role / missing permission). */
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

/** Use in catch blocks: stable message + permission flag for UX branching. */
export function classifyApiError(error: unknown): { message: string; permissionDenied: boolean } {
  return {
    message: error instanceof Error ? error.message : "Xatolik yuz berdi",
    permissionDenied: isPermissionDeniedError(error),
  }
}

/** True when the resource does not exist or is not visible to this user. */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiHttpError) {
    return error.statusCode === 404
  }
  if (error instanceof Error) {
    return /\b404\b|not\s*found|topilmadi|mavjud\s*emas/i.test(error.message)
  }
  return false
}

export type EmbeddedApiErrorKind = "permission" | "not_found" | "server" | "session" | "step_up"

export interface EmbeddedApiErrorDescription {
  kind: EmbeddedApiErrorKind
  title: string
  description: string
}

/**
 * Map API failures to stable copy for forms, dialogs, and mutations.
 * Validation errors should be handled before calling this (client-side only).
 */
export function describeEmbeddedApiError(error: unknown): EmbeddedApiErrorDescription {
  const raw = error instanceof Error ? error.message : "Xatolik yuz berdi"

  if (isStepUpRequiredError(error)) {
    return {
      kind: "step_up",
      title: "Qayta tasdiqlash kerak",
      description:
        "Bu amal uchun parolingizni qayta kiritishingiz kerak. Amalni qayta bosing — parol oynasi ochiladi.",
    }
  }

  if (raw === "Sessiya tugadi") {
    return {
      kind: "session",
      title: "Sessiya tugadi",
      description: "Qayta kirish talab qilinadi.",
    }
  }

  if (isPermissionDeniedError(error)) {
    return {
      kind: "permission",
      title: "Ruxsat yetarli emas",
      description:
        "Bu amalni bajarish uchun hisobingizda kerakli ruxsat yo'q. Kerak bo'lsa, markaz superadminiga murojaat qiling.",
    }
  }

  if (isNotFoundError(error)) {
    return {
      kind: "not_found",
      title: "Ma'lumot topilmadi",
      description: "Yozuv o'chirilgan, boshqa markazga tegishli yoki sizga ko'rinmaydi.",
    }
  }

  return {
    kind: "server",
    title: "So'rov bajarilmadi",
    description: raw,
  }
}

/**
 * Compact single line for DataTable `error`, stats banners, and hooks that only store a string.
 * Uses the same classification as describeEmbeddedApiError().
 */
export function formatEmbeddedApiError(error: unknown): string {
  const d = describeEmbeddedApiError(error)
  return `${d.title} — ${d.description}`
}
