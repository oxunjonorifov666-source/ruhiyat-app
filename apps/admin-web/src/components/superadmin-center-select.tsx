"use client"

import type { LucideIcon } from "lucide-react"
import { Building2, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface SuperadminCenterSelectProps {
  centers: { id: number; name: string }[]
  centersLoading: boolean
  value: number | null
  onChange: (id: number) => void
  disabled?: boolean
  id?: string
}

export function SuperadminCenterSelect({
  centers,
  centersLoading,
  value,
  onChange,
  disabled,
  id = "superadmin-center-select",
}: SuperadminCenterSelectProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full min-w-[220px] max-w-sm">
      <Label htmlFor={id} className="text-xs text-muted-foreground sr-only sm:not-sr-only">
        Ta&apos;lim markazi
      </Label>
      <Select
        value={value != null ? String(value) : undefined}
        onValueChange={(v) => onChange(parseInt(v, 10))}
        disabled={disabled || centersLoading}
      >
        <SelectTrigger
          id={id}
          className="h-10 w-full min-w-[220px] rounded-lg border-border/80 bg-card shadow-sm transition-[box-shadow,border-color] hover:border-primary/30 focus:ring-2 focus:ring-primary/20"
        >
          {centersLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin shrink-0" />
              Markazlar yuklanmoqda…
            </span>
          ) : (
            <SelectValue placeholder="Markazni tanlang" />
          )}
        </SelectTrigger>
        <SelectContent>
          {centers.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SuperadminCenterEmptyState({
  centers,
  centersLoading,
  onSelect,
}: {
  centers: { id: number; name: string }[]
  centersLoading: boolean
  onSelect: (id: number) => void
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card text-card-foreground shadow-md ring-1 ring-primary/[0.06]">
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-5 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner ring-1 ring-primary/10">
          <Building2 className="size-7" strokeWidth={1.75} />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Markazni tanlang</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Superadmin uchun ma&apos;lumotlar tanlangan ta&apos;lim markazi bo&apos;yicha ko&apos;rsatiladi. Davom etish uchun
            ro&apos;yxatdan markazni tanlang — tanlov URL va seans davomida saqlanadi.
          </p>
        </div>
        <SuperadminCenterSelect
          centers={centers}
          centersLoading={centersLoading}
          value={null}
          onChange={onSelect}
        />
      </div>
    </div>
  )
}

/** Full-page “markaz tanlang” for center-scoped modules (reuses dashboard/statistics pattern). */
export function SuperadminCenterRequiredScreen({
  title,
  description,
  icon,
  centers,
  centersLoading,
  setCenterId,
}: {
  title: string
  description: string
  icon: LucideIcon
  centers: { id: number; name: string }[]
  centersLoading: boolean
  setCenterId: (id: number) => void
}) {
  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={
          <SuperadminCenterSelect
            centers={centers}
            centersLoading={centersLoading}
            value={null}
            onChange={setCenterId}
          />
        }
      />
      <SuperadminCenterEmptyState centers={centers} centersLoading={centersLoading} onSelect={setCenterId} />
    </div>
  )
}
