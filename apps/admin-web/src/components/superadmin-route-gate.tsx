"use client"

import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface SuperadminRouteGateProps {
  /** Short module title for the message */
  title: string
  children: React.ReactNode
}

/**
 * Wraps pages whose Nest APIs are @Roles(SUPERADMIN) (audit, security, integrations,
 * bloklash, global rollar, va hokazo).
 * Center administrators see an explicit unavailable state instead of 403 spam.
 */
export function SuperadminRouteGate({ title, children }: SuperadminRouteGateProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Yuklanmoqda...</span>
      </div>
    )
  }

  if (user?.role !== "SUPERADMIN") {
    return (
      <div className="mx-auto max-w-lg space-y-6 py-12">
        <Card className="border-amber-500/35 shadow-md ring-1 ring-amber-500/10">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-500">
                <ShieldAlert className="size-5" strokeWidth={1.75} />
              </div>
              <CardTitle className="text-xl font-semibold leading-tight">{title}</CardTitle>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              Bu bo&apos;lim backendda faqat <strong>superadmin</strong> uchun mo&apos;ljallangan
              (masalan: bloklash, xodim rollari, faollik jurnali, xavfsizlik, integratsiyalar). Markaz
              administratori uchun mavjud emas.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="default" className="shadow-sm">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 size-4" />
                Boshqaruv paneliga
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
