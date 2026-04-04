"use client"

import { Brain, MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/components/auth-provider"

const socialLinks = [
  { label: "Telegram", href: "https://t.me/ruhiyat", icon: "📨" },
  { label: "Instagram", href: "https://instagram.com/ruhiyat", icon: "📷" },
  { label: "Facebook", href: "https://facebook.com/ruhiyat", icon: "📘" },
]

export function AppFooter() {
  const { user } = useAuth()

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="px-6 py-6">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Brain className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Ruhiyat</h3>
                <p className="text-[10px] text-muted-foreground">Raqamli ruhiy salomatlik</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ruhiyat — raqamli ruhiy salomatlik ekotizimi. Psixologik yordam, testlar, treninglar va hamjamiyat platformasi.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ijtimoiy tarmoqlar</h4>
            <div className="space-y-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  <ExternalLink className="size-3" />
                </a>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aloqa</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span>Toshkent sh., O'zbekiston</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="size-3 shrink-0" />
                <span>+998 71 123 45 67</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3 shrink-0" />
                <span>info@ruhiyat.uz</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Globe className="size-3 shrink-0" />
                <span>www.ruhiyat.uz</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Xarita</h4>
            <div className="h-24 rounded-md border border-dashed bg-muted/50 flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Xarita joylashtiriladi</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Ruhiyat. Barcha huquqlar himoyalangan.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          {user && (
            <span>Sessiya: {user.email || "Noma'lum"}</span>
          )}
          <span>v1.0.0</span>
        </div>
      </div>
    </footer>
  )
}
