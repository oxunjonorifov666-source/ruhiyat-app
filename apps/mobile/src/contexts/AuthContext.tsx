import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEYS } from '../config';
import { apiClient } from '../services/api';
import { authService, type AuthUser } from '../services/auth';
import { setTelemetryOptIn } from '../services/telemetry';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  refreshProfile: async () => {},
  resetInactivityTimer: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  /** Foydalanuvchi hech narsa tegmasa — 10 daqiqadan keyin chiqish */
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

  const logout = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    if (refreshToken) await authService.logout(refreshToken);
    await clearTokens();
    setUser(null);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (__DEV__) {
        console.log('Inactivity timeout reached. Logging out...');
      }
      logout();
    }, INACTIVITY_TIMEOUT);
  }, [user, logout]);

  const saveTokens = async (accessToken: string, refreshToken: string) => {
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
    apiClient.setTokens(accessToken, refreshToken);
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    apiClient.setTokens(null, null);
  };

  const login = useCallback(async (accessToken: string, refreshToken: string, userData: AuthUser) => {
    await saveTokens(accessToken, refreshToken);
    setUser(userData);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await authService.getProfile();
      setUser(data.user);
    } catch {}
  }, []);

  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    } else if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  }, [user, resetInactivityTimer]);

  useEffect(() => {
    setTelemetryOptIn(!!user?.analyticsOptIn);
  }, [user?.analyticsOptIn]);

  useEffect(() => {
    apiClient.setCallbacks(
      async (newAccess: string, newRefresh: string) => {
        await saveTokens(newAccess, newRefresh);
      },
      async () => {
        await clearTokens();
        setUser(null);
      },
    );

    async function initAuth() {
      try {
        const accessToken = await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
        const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
        if (!accessToken || !refreshToken) { setIsLoading(false); return; }
        apiClient.setTokens(accessToken, refreshToken);
        const data = await authService.getProfile();
        setUser(data.user);
      } catch {
        await clearTokens();
      }
      setIsLoading(false);
    }

    initAuth();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      refreshProfile,
      resetInactivityTimer 
    }}>
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);
