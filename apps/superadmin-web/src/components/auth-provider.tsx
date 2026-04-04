"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  type AuthUser,
  fetchMe,
  refreshTokenApi,
  logoutApi,
  getStoredTokens,
  storeTokens,
  clearTokens,
} from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  accessToken: string | null
  permissions: string[]
  hasPermission: (permission: string) => boolean
  logout: () => Promise<void>
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  permissions: [],
  hasPermission: () => false,
  logout: async () => {},
  setAuth: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const permissions = user?.permissions ?? []

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    if (user.role === 'SUPERADMIN') return true
    if (permissions.includes('*')) return true
    return permissions.includes(permission)
  }, [user, permissions])

  const handleLogout = useCallback(async () => {
    const tokens = getStoredTokens()
    if (tokens?.refreshToken) {
      await logoutApi(tokens.refreshToken)
    }
    clearTokens()
    setUser(null)
    setAccessToken(null)
    router.push('/login')
  }, [router])

  const setAuth = useCallback((newUser: AuthUser, newAccessToken: string, newRefreshToken: string) => {
    setUser(newUser)
    setAccessToken(newAccessToken)
    storeTokens(newAccessToken, newRefreshToken)
  }, [])

  useEffect(() => {
    async function initAuth() {
      const tokens = getStoredTokens()
      if (!tokens) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await fetchMe(tokens.accessToken)
        if (userData.role !== 'SUPERADMIN') {
          clearTokens()
          setIsLoading(false)
          return
        }
        setUser(userData)
        setAccessToken(tokens.accessToken)
      } catch {
        try {
          const newTokens = await refreshTokenApi(tokens.refreshToken)
          storeTokens(newTokens.accessToken, newTokens.refreshToken)
          const userData = await fetchMe(newTokens.accessToken)
          if (userData.role !== 'SUPERADMIN') {
            clearTokens()
            setIsLoading(false)
            return
          }
          setUser(userData)
          setAccessToken(newTokens.accessToken)
        } catch {
          clearTokens()
        }
      }

      setIsLoading(false)
    }

    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        accessToken,
        permissions,
        hasPermission,
        logout: handleLogout,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
