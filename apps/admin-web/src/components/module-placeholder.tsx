import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"

interface ModulePlaceholderProps {
  title: string
  description: string
  icon: LucideIcon
  features?: string[]
}

export function ModulePlaceholder({ title, description, icon: Icon, features }: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features?.map((feature, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{feature}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-24 items-center justify-center rounded-lg border border-dashed">
                <span className="text-xs text-muted-foreground">Tez kunda</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!features?.length && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <Icon className="mx-auto size-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Modul ishlab chiqilmoqda</p>
                <p className="text-xs text-muted-foreground mt-1">Bu sahifa tez orada to'ldiriladi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
