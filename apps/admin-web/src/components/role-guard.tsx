"use client"

import React from "react"
import { useAuth } from "@/components/auth-provider"
import { hasPermission, type Permission } from "@/lib/permissions"

interface RoleGuardProps {
  requires: Permission | Permission[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children if the current authenticated user
 * satisfies the required capability scopes.
 */
export function RoleGuard({ requires, children, fallback = null }: RoleGuardProps) {
  const { user, isLoading } = useAuth()

  // Prevent flash of unauthorized content while session loads
  if (isLoading) return null

  const isAllowed = hasPermission(user, requires)

  if (!isAllowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
