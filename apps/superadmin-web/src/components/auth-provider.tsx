"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { type AuthUser, sessionMe, sessionLogout, sessionRefresh, clearLegacyBrowserTokens } from '@/lib/auth'
import { disconnectChatSocket } from '@/lib/chat-socket'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  /** HttpOnly sessiya — brauzerda token yo‘q */
  accessToken: null
  permissions: string[]
  hasPermission: (permission: string) => boolean
  logout: () => Promise<void>
  setUser: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  accessToken: null,
  permissions: [],
  hasPermission: () => false,
  logout: async () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const permissions = user?.permissions ?? []

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false
      if (user.role === 'SUPERADMIN') return true
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    },
    [user, permissions],
  )

  const handleLogout = useCallback(async () => {
    disconnectChatSocket()
    await sessionLogout()
    setUser(null)
    router.push('/login')
  }, [router])

  const setUserOnly = useCallback((newUser: AuthUser) => {
    setUser(newUser)
  }, [])

  useEffect(() => {
    clearLegacyBrowserTokens()
  }, [])

  useEffect(() => {
    async function initAuth() {
      try {
        const userData = await sessionMe()
        if (userData.role !== 'SUPERADMIN') {
          await sessionLogout()
          setIsLoading(false)
          return
        }
        setUser(userData)
      } catch {
        try {
          const ok = await sessionRefresh()
          if (!ok) {
            setIsLoading(false)
            return
          }
          const userData = await sessionMe()
          if (userData.role !== 'SUPERADMIN') {
            await sessionLogout()
            setIsLoading(false)
            return
          }
          setUser(userData)
        } catch {
          /* sessiya yo‘q */
        }
      } finally {
        setIsLoading(false)
      }
    }

    void initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        accessToken: null,
        permissions,
        hasPermission,
        logout: handleLogout,
        setUser: setUserOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
