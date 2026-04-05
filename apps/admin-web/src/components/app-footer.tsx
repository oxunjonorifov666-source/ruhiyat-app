"use client"

import { useAuth } from "@/components/auth-provider"

export function AppFooter() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name || "Markaz"

  return (
    <footer className="border-t bg-muted/30 px-4 py-3 md:px-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Ruhiyat</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">Raqamli ruhiy salomatlik platformasi</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Aloqa: info@ruhiyat.uz | +998 71 200 00 00
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>Sessiya: {centerName}</span>
            <span>v1.0.0</span>
          </div>
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ruhiyat. Barcha huquqlar himoyalangan.
          </span>
        </div>
      </div>
    </footer>
  )
}
