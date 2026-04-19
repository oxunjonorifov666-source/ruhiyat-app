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
  /** Ilova faolligi (PIN qulfi va sessiya uchun) */
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

  const logout = useCallback(async () => {
    const refreshToken = await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    if (refreshToken) await authService.logout(refreshToken);
    await clearTokens();
    setUser(null);
  }, []);

  /** Eski API bilan moslik: PIN qulfi va boshqa komponentlar chaqirishi mumkin (sessiya faolligi) */
  const resetInactivityTimer = useCallback(() => {}, []);

  const saveTokens = async (accessToken: string, refreshToken: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
      await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
      apiClient.setTokens(accessToken, refreshToken);
    } catch (e) {
      if (__DEV__) {
        console.error('[Auth] SecureStore.saveTokens', e);
      }
      throw new Error(
        "Tokenlarni qurilmada xavfsiz saqlab bo‘lmadi. Ilova huquqlari / ekran qulflash sozlamalarini tekshiring.",
      );
    }
  };

  const clearTokens = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
    apiClient.setTokens(null, null);
  };

  const login = useCallback(async (accessToken: string, refreshToken: string, userData: AuthUser) => {
    await saveTokens(accessToken, refreshToken);
    setUser(userData);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await authService.getProfile();
      setUser(data.user);
    } catch {}
  }, []);

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
