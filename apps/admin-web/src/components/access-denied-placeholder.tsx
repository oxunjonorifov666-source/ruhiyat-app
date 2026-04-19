"use client"

import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AccessDeniedPlaceholderProps {
  title?: string
  description?: string
  /** Optional raw backend message (shown muted, for support/debug). */
  detail?: string | null
}

export function AccessDeniedPlaceholder({
  title = "Bu bo‘lim uchun ruxsat yo‘q",
  description = "Bu sahifani ko‘rish yoki boshqarish uchun hisobingizga kerakli ruxsat berilmagan. Kerak bo‘lsa, markaz superadmini yoki tizim administratoriga murojaat qiling.",
  detail,
}: AccessDeniedPlaceholderProps) {
  return (
    <Card className="rounded-xl border-amber-500/30 bg-amber-500/[0.035] shadow-sm ring-1 ring-amber-500/15 dark:bg-amber-500/[0.06] dark:ring-amber-500/20">
      <CardHeader className="pb-2">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-400">
            <ShieldAlert className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-lg font-semibold leading-snug tracking-tight">{title}</CardTitle>
            <CardDescription className="text-base leading-relaxed text-muted-foreground">
              {description}
            </CardDescription>
            {detail ? (
              <p className="pt-2 text-xs font-mono text-muted-foreground/90 break-words">{detail}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-muted-foreground">
        Bu xabar server javobi (403/401) asosida ko‘rsatiladi — modul buzilmagan, sizda kirish cheklangan.
      </CardContent>
    </Card>
  )
}
