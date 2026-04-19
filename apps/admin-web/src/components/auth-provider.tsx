"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  type AuthUser,
  fetchMe,
  refreshTokenApi,
  logoutApi,
  storeTokens,
  clearTokens,
} from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  /** @deprecated Access JWT is HttpOnly; always null. Kept for compatibility. */
  accessToken: string | null
  logout: () => Promise<void>
  setAuth: (user: AuthUser, _accessToken?: string, _refreshToken?: string) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  logout: async () => {},
  setAuth: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const handleLogout = useCallback(async () => {
    await logoutApi()
    clearTokens()
    setUser(null)
    router.push('/login')
  }, [router])

  const setAuth = useCallback((newUser: AuthUser, _newAccessToken?: string, _newRefreshToken?: string) => {
    setUser(newUser)
    storeTokens()
  }, [])

  useEffect(() => {
    async function initAuth() {
      try {
        const data = await fetchMe()
        if (data.user.role !== 'ADMINISTRATOR' && data.user.role !== 'SUPERADMIN') {
          clearTokens()
          setIsLoading(false)
          return
        }
        setUser(data.user)
      } catch {
        try {
          await refreshTokenApi()
          const data = await fetchMe()
          if (data.user.role !== 'ADMINISTRATOR' && data.user.role !== 'SUPERADMIN') {
            clearTokens()
            setIsLoading(false)
            return
          }
          setUser(data.user)
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
        accessToken: null,
        logout: handleLogout,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
