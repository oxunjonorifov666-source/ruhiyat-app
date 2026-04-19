"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useApiData } from "@/hooks/use-api-data"
import type { AuthUser } from "@/lib/auth"

export const SUPERADMIN_SELECTED_CENTER_STORAGE_KEY = "ruhiyat.superadmin.selectedCenterId"

function readStoredCenterId(): number | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(SUPERADMIN_SELECTED_CENTER_STORAGE_KEY)
  if (!raw) return null
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

interface CentersListResponse {
  data: { id: number; name: string }[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function useSuperadminCenter(user: AuthUser | null) {
  const isSuperadmin = user?.role === "SUPERADMIN"
  const adminCenterId = user?.administrator?.centerId ?? null
  const adminCenterName = user?.administrator?.center?.name ?? "Markaz"

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const queryRaw = searchParams.get("centerId")
  const queryNum = queryRaw ? parseInt(queryRaw, 10) : NaN
  const fromQuery = Number.isFinite(queryNum) ? queryNum : null

  const storedFromBrowser = mounted ? readStoredCenterId() : null

  const effectiveCenterId = useMemo(() => {
    if (!isSuperadmin) return adminCenterId
    return fromQuery ?? storedFromBrowser ?? null
  }, [isSuperadmin, adminCenterId, fromQuery, storedFromBrowser])

  useEffect(() => {
    if (!isSuperadmin || !mounted) return
    if (fromQuery != null) {
      sessionStorage.setItem(SUPERADMIN_SELECTED_CENTER_STORAGE_KEY, String(fromQuery))
      return
    }
    if (storedFromBrowser != null) {
      router.replace(`${pathname}?centerId=${storedFromBrowser}`, { scroll: false })
    }
  }, [isSuperadmin, mounted, fromQuery, storedFromBrowser, pathname, router])

  const {
    data: centersPage,
    loading: centersLoading,
    error: centersError,
  } = useApiData<CentersListResponse>({
    path: "/education-centers",
    params: { limit: 100 },
    enabled: Boolean(isSuperadmin),
  })

  const centers = centersPage?.data ?? []

  const centerDisplayName = useMemo(() => {
    if (!isSuperadmin) return adminCenterName
    if (effectiveCenterId == null) return "Markaz"
    const row = centers.find((c) => c.id === effectiveCenterId)
    return row?.name ?? "Markaz"
  }, [isSuperadmin, adminCenterName, effectiveCenterId, centers])

  const needsCenterSelection = Boolean(isSuperadmin && effectiveCenterId == null)

  const setCenterId = useCallback(
    (id: number) => {
      sessionStorage.setItem(SUPERADMIN_SELECTED_CENTER_STORAGE_KEY, String(id))
      router.replace(`${pathname}?centerId=${id}`, { scroll: false })
    },
    [pathname, router]
  )

  return {
    isSuperadmin,
    effectiveCenterId,
    needsCenterSelection,
    setCenterId,
    centerDisplayName,
    adminCenterName,
    centers,
    centersLoading,
    centersError,
  }
}
