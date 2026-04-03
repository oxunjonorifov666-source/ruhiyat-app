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
  logout: () => Promise<void>
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
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
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

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
        const data = await fetchMe(tokens.accessToken)
        if (data.user.role !== 'ADMINISTRATOR') {
          clearTokens()
          setIsLoading(false)
          return
        }
        setUser(data.user)
        setAccessToken(tokens.accessToken)
      } catch {
        try {
          const newTokens = await refreshTokenApi(tokens.refreshToken)
          storeTokens(newTokens.accessToken, newTokens.refreshToken)
          const data = await fetchMe(newTokens.accessToken)
          if (data.user.role !== 'ADMINISTRATOR') {
            clearTokens()
            setIsLoading(false)
            return
          }
          setUser(data.user)
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
        logout: handleLogout,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
