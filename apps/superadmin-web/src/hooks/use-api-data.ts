"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { apiClient } from "@/lib/api-client"

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
  refresh: () => Promise<void>
  mutate: (newData: T) => void
}

export function useApiData<T = any>(options: UseApiDataOptions<T>): UseApiDataReturn<T> {
  const { path, params, enabled = true, refreshInterval, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params])

  const fetchData = useCallback(async () => {
    if (!enabled) return
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await apiClient<T>(path, { params })
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setData(result)
        onSuccess?.(result)
      }
    } catch (e: any) {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setError(e.message || "Xatolik yuz berdi")
        onError?.(e.message)
      }
    } finally {
      if (mountedRef.current && fetchId === fetchIdRef.current) {
        setLoading(false)
      }
    }
  }, [path, paramsKey, enabled])

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

  return { data, loading, error, refresh: fetchData, mutate }
}
