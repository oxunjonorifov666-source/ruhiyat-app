"use client"

import { type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface PageHeaderAction {
  label: string
  onClick?: () => void
  icon?: LucideIcon
  variant?: "default" | "outline" | "ghost" | "secondary"
}

interface PageHeaderProps {
  title: string
  description?: string
  subtitle?: string
  icon?: LucideIcon
  badge?: string
  badgeVariant?: "default" | "secondary" | "outline" | "destructive"
  actions?: PageHeaderAction[] | React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  subtitle,
  icon: Icon,
  badge: badgeText,
  badgeVariant = "secondary",
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-1">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {badgeText && <Badge variant={badgeVariant}>{badgeText}</Badge>}
            </div>
            {(description || subtitle) && (
              <p className="text-sm text-muted-foreground mt-0.5">{description || subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          Array.isArray(actions) ? (
            <div className="flex items-center gap-2 shrink-0">
              {(actions as PageHeaderAction[]).map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant || "default"}
                  size="sm"
                  onClick={action.onClick}
                >
                  {action.icon && <action.icon className="size-4 mr-1.5" />}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="shrink-0">{actions}</div>
          )
        )}
      </div>
      {children}
    </div>
  )
}
