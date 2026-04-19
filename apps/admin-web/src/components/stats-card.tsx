import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: React.ReactNode
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  iconColor?: string
  loading?: boolean
}

export function StatsCard({ title, value, description, icon: Icon, trend, iconColor, loading }: StatsCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="size-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-shadow duration-200 hover:shadow-md hover:ring-primary/5">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
            {description && <p className="text-xs leading-snug text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-red-600")}>
                {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-inner ring-1 ring-black/5 transition-colors dark:ring-white/10",
              iconColor || "bg-primary/10 text-primary",
            )}
          >
            <Icon className="size-5" strokeWidth={1.75} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4 | 5
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  const colClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
    5: "md:grid-cols-3 lg:grid-cols-5",
  }
  return <div className={cn("grid gap-4 md:gap-5", colClass[columns])}>{children}</div>
}
