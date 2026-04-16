import { Suspense } from "react"
import { SessionsList } from "./_components/sessions-list"

export default function SessionsPage() {
  return (
    <Suspense fallback={<div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">Yuklanmoqda...</div>}>
      <SessionsList mode="default" />
    </Suspense>
  )
}
