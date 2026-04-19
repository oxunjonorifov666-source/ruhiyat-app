"use client"

import type { EmbeddedApiErrorDescription } from "@/lib/api-error"

interface EmbeddedApiErrorBannerProps {
  error: EmbeddedApiErrorDescription | null
  className?: string
}

export function EmbeddedApiErrorBanner({ error, className = "" }: EmbeddedApiErrorBannerProps) {
  if (!error) return null

  const border =
    error.kind === "permission"
      ? "border-amber-500/40 bg-amber-500/[0.06]"
      : error.kind === "not_found" || error.kind === "session"
        ? "border-muted-foreground/25 bg-muted/40"
        : "border-destructive/35 bg-destructive/[0.06]"

  return (
    <div
      role="alert"
      className={`rounded-xl border px-4 py-3.5 text-sm shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06] ${border} ${className}`}
    >
      <p className="font-semibold tracking-tight text-foreground">{error.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error.description}</p>
    </div>
  )
}
