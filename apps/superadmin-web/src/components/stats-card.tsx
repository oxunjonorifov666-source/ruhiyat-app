import { Card, CardContent } from "@/components/ui/card"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  iconColor?: string
}

export function StatsCard({ title, value, description, icon: Icon, trend, iconColor }: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {trend && (
              <p className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-red-600")}>
                {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("flex size-10 items-center justify-center rounded-lg", iconColor || "bg-primary/10 text-primary")}>
            <Icon className="size-5" />
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
  return <div className={cn("grid gap-4", colClass[columns])}>{children}</div>
}
