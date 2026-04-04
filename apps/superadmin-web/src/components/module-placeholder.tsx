"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type LucideIcon, Construction } from "lucide-react"
import { PageHeader } from "@/components/page-header"

interface PlaceholderFeature {
  title: string
  description: string
  icon?: LucideIcon
}

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  features?: string[] | PlaceholderFeature[]
  status?: "development" | "planned" | "coming-soon"
}

const statusConfig = {
  development: { label: "Ishlab chiqilmoqda", variant: "default" as const },
  planned: { label: "Rejalashtirilgan", variant: "secondary" as const },
  "coming-soon": { label: "Tez kunda", variant: "outline" as const },
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  features,
  status = "development",
}: ModulePlaceholderProps) {
  const statusInfo = statusConfig[status]

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={Icon}
        badge={statusInfo.label}
        badgeVariant={statusInfo.variant}
      />

      {features && features.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const featureTitle = typeof feature === "string" ? feature : feature.title
            const featureDesc = typeof feature === "string" ? null : feature.description
            const FeatureIcon = typeof feature === "string" ? null : feature.icon

            return (
              <Card key={i} className="border-dashed">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    {FeatureIcon && (
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FeatureIcon className="size-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{featureTitle}</p>
                      {featureDesc && (
                        <p className="text-xs text-muted-foreground">{featureDesc}</p>
                      )}
                      {!featureDesc && (
                        <p className="text-xs text-muted-foreground">Tez kunda ishga tushiriladi</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {(!features || features.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="p-0">
            <div className="flex h-72 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted mb-4">
                  <Construction className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Modul ishlab chiqilmoqda</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Bu modul hozirda ishlab chiqilmoqda. Tez orada to'liq funksionallik bilan ishga tushiriladi.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
