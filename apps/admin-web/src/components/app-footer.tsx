"use client"

import { useAuth } from "@/components/auth-provider"
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react"

export function AppFooter() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name || "Markaz ma'lumotlari kutilmoqda"

  return (
    <footer className="border-t border-border/60 bg-muted/10">
      <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-8 px-4 py-8 md:grid-cols-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">Ruhiyat</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Insonlarning ichki holatini tushunish, ruhiy barqarorligini mustahkamlash va ongli hayot tarzini shakllantirishga ko‘maklashuvchi raqamli muhit.
          </p>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors"><Instagram className="size-4" /></a>
            <a href="#" className="hover:text-primary transition-colors"><Facebook className="size-4" /></a>
            <a href="#" className="hover:text-primary transition-colors"><Twitter className="size-4" /></a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold">Bog'lanish</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="size-3.5" />
            <span>+998 71 200 00 00</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="size-3.5" />
            <span>info@ruhiyat.uz</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 mt-0.5" />
            <span>Toshkent shahar, Yunusobod tumani, 19-mavze, 12-uy</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:col-span-2">
          <span className="text-sm font-semibold">Joylashuv (Xarita)</span>
          <div className="flex h-24 w-full items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-xs text-muted-foreground">
            [Xarita moduli integratsiyasi]
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 border-t border-border/50 px-4 py-5 md:flex-row md:items-center md:justify-between md:px-6 lg:px-8">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-4">
          <span className="text-xs text-muted-foreground font-medium">Sessiya yurituvchisi: {centerName}</span>
          <span className="text-xs text-muted-foreground">Tizim versiyasi: v1.0.0-enterprise</span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          Ruhiyat Administrator &copy; 2026 Barcha huquqlar to'liq himoyalangan
        </span>
      </div>
    </footer>
  )
}
