"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { getRequiredPermissionForPath } from "@/lib/superadmin-path-permissions"

/** Middleware bilan bir qatorda: mijozda ruxsat tekshiruvi (zero trust UI) */
export function RoutePermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { hasPermission, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    const required = getRequiredPermissionForPath(pathname)
    if (required && !hasPermission(required)) {
      router.replace("/forbidden")
    }
  }, [isLoading, isAuthenticated, pathname, hasPermission, router])

  return <>{children}</>
}
