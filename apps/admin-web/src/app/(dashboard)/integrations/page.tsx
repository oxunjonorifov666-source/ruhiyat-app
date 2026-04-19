"use client"

import { useEffect, useState, useCallback } from "react"
import { Plug, CheckCircle, XCircle, Settings } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SuperadminRouteGate } from "@/components/superadmin-route-gate"
import { classifyApiError, formatEmbeddedApiError } from "@/lib/api-error"
import { AccessDeniedPlaceholder } from "@/components/access-denied-placeholder"

interface Integration {
  id: number
  name: string
  type: string
  description: string | null
  isEnabled: boolean
  config: any
  createdAt: string
}

function IntegrationsPageContent() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const res = await apiClient<{ data: Integration[] }>("/integrations")
      setIntegrations(res.data || [])
    } catch (e: unknown) {
      const { permissionDenied: denied } = classifyApiError(e)
      if (denied) setPermissionDenied(true)
      else setError(formatEmbeddedApiError(e))
    }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const enabled = integrations.filter(i => i.isEnabled).length

  if (permissionDenied) {
    return (
      <div className="space-y-6">
        <PageHeader title="Integratsiyalar" subtitle="Tashqi xizmatlar va ulanishlarni boshqarish" icon={Plug} />
        <AccessDeniedPlaceholder
          title="Integratsiyalarga ruxsat yo'q"
          description="Integratsiyalar ro'yxati odatda superadmin yoki tizim integratsiya ruxsatida."
          detail={error}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Integratsiyalar" subtitle="Tashqi xizmatlar va ulanishlarni boshqarish" icon={Plug} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Plug className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{integrations.length}</p>
                <p className="text-xs text-muted-foreground">Jami integratsiyalar</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabled}</p>
                <p className="text-xs text-muted-foreground">Faol</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900/30">
                <XCircle className="size-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{integrations.length - enabled}</p>
                <p className="text-xs text-muted-foreground">Nofaol</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card><CardContent className="py-8 text-center text-destructive">{error}</CardContent></Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="py-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        ) : integrations.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Plug className="mx-auto size-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Integratsiyalar topilmadi</p>
              <p className="text-xs text-muted-foreground mt-1">Tashqi xizmatlar sozlanmagan</p>
            </CardContent>
          </Card>
        ) : (
          integrations.map((intg) => (
            <Card key={intg.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{intg.name}</CardTitle>
                  <Badge variant={intg.isEnabled ? "default" : "secondary"}>
                    {intg.isEnabled ? "Faol" : "Nofaol"}
                  </Badge>
                </div>
                <CardDescription>{intg.description || intg.type}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{intg.type}</span>
                  <span className="text-xs">{new Date(intg.createdAt).toLocaleDateString("uz-UZ")}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <SuperadminRouteGate title="Integratsiyalar">
      <IntegrationsPageContent />
    </SuperadminRouteGate>
  )
}
