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
    <div className="mb-8 space-y-1 border-b border-border/60 pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon && (
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary shadow-sm ring-1 ring-primary/10 dark:bg-primary/15 dark:ring-primary/20">
              <Icon className="size-[1.35rem]" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.375rem] font-semibold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              {badgeText && <Badge variant={badgeVariant}>{badgeText}</Badge>}
            </div>
            {(description || subtitle) && (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {description || subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          Array.isArray(actions) ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:pt-0.5">
              {(actions as PageHeaderAction[]).map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant || "default"}
                  size="sm"
                  className="shadow-sm"
                  onClick={action.onClick}
                >
                  {action.icon && <action.icon className="size-4 mr-1.5" />}
                  {action.label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:pt-0.5">{actions}</div>
          )
        )}
      </div>
      {children}
    </div>
  )
}
