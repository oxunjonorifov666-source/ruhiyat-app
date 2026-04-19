"use client"

import * as React from "react"
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginApi, storeTokens } from "@/lib/auth"
import { formatEmbeddedApiError } from "@/lib/api-error"

export default function LoginPage() {
  const [showPassword, setShowPassword] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [identifier, setIdentifier] = React.useState("")
  const [password, setPassword] = React.useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = await loginApi(identifier, password)

      if (data.user.role !== "ADMINISTRATOR" && data.user.role !== "SUPERADMIN") {
        setError("Faqat administratorlar kirishi mumkin")
        setLoading(false)
        return
      }

      storeTokens(data.accessToken, data.refreshToken)
      // To‘liq sahifa o‘tishi kerak: middleware cookie’ni keyingi so‘rovda ko‘radi (client-side router.push ba’zan yetishmaydi)
      window.location.assign("/dashboard")
    } catch (err: unknown) {
      setError(formatEmbeddedApiError(err))
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-muted/15 to-muted/35 p-4">
      <Card className="w-full max-w-md rounded-2xl border-border/60 shadow-lg shadow-primary/[0.06] ring-1 ring-border/40">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/25">
            <Building2 className="size-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Ruhiyat Administrator</CardTitle>
          <CardDescription>Ta'lim markazi boshqaruv paneliga kirish</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="identifier">Elektron pochta yoki telefon</Label>
              <Input
                id="identifier"
                placeholder="admin@markaz.uz"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Kirish..." : "Kirish"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
