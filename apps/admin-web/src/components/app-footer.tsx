"use client"

import { useAuth } from "@/components/auth-provider"
import { Facebook, Instagram, Twitter, MapPin, Mail, Phone } from "lucide-react"

export function AppFooter() {
  const { user } = useAuth()
  const centerName = user?.administrator?.center?.name || "Markaz ma'lumotlari kutilmoqda"

  return (
    <footer className="border-t bg-muted/20 px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
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
          <div className="w-full h-24 bg-muted rounded-md border flex items-center justify-center text-xs text-muted-foreground">
            [Xarita moduli integratsiyasi]
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-t pt-4">
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
