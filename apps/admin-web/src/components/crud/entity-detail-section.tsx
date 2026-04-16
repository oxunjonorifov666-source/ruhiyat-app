import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EntityDetailSectionProps {
  title: string
  description?: string
  icon?: React.ElementType
  children: ReactNode
  className?: string
  action?: ReactNode
}

export function EntityDetailSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  action
}: EntityDetailSectionProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/30 border-b pb-4 flex flex-row items-start justify-between">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <Icon className="size-4 text-primary" />
            </div>
          )}
          <div>
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription className="text-xs mt-0.5">{description}</CardDescription>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  )
}

export function DetailRow({ label, value, colSpan = 1 }: { label: string, value: ReactNode, colSpan?: number }) {
  return (
    <div className={cn("flex flex-col gap-1", colSpan > 1 && `col-span-${colSpan}`)}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{value !== undefined && value !== null && value !== "" ? value : "—"}</div>
    </div>
  )
}
