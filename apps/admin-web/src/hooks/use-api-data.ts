"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { apiClient } from "@/lib/api-client"
import { formatEmbeddedApiError, isPermissionDeniedError } from "@/lib/api-error"

interface UseApiDataOptions<T> {
  path: string
  params?: Record<string, string | number | undefined>
  enabled?: boolean
  refreshInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

interface UseApiDataReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  /** True when API returned 401/403 — show access-denied UX, not “random” failure. */
  permissionDenied: boolean
  refresh: () => Promise<void>
  mutate: (newData: T) => void
}

export function useApiData<T = any>(options: UseApiDataOptions<T>): UseApiDataReturn<T> {
  const { path, params, enabled = true, refreshInterval, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      setPermissionDenied(false)
      return
    }
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    setPermissionDenied(false)
    try {
      const result = await apiClient<T>(path, { params })
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setData(result)
        setPermissionDenied(false)
        onSuccess?.(result)
      }
    } catch (e: unknown) {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        const line = formatEmbeddedApiError(e)
        setError(line)
        setPermissionDenied(isPermissionDeniedError(e))
        onError?.(line)
      }
    } finally {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [path, JSON.stringify(params), enabled])

  useEffect(() => {
    mountedRef.current = true
    fetchData()
    return () => { mountedRef.current = false }
  }, [fetchData])

  useEffect(() => {
    if (!refreshInterval || !enabled) return
    const interval = setInterval(fetchData, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchData, refreshInterval, enabled])

  const mutate = useCallback((newData: T) => {
    setData(newData)
  }, [])

  return { data, loading, error, permissionDenied, refresh: fetchData, mutate }
}
