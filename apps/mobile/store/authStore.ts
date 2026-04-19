import { create } from 'zustand';
import { api } from '~/lib/api';
import { clearTokens, saveTokens } from '~/lib/auth-token';
import { recordMobileConsent } from '~/lib/compliance';
import type { AuthTokensResponse, AuthUserPayload } from '~/types/auth';
import { useLegalStore } from './legalStore';
import { usePremiumEntitlementStore } from './premiumEntitlementStore';

type LoginPayload =
  | { email: string; password: string }
  | { phone: string; password: string };

type RegisterPayload = {
  email?: string;
  phone?: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

type AuthState = {
  user: AuthUserPayload | null;
  hydrated: boolean;
  setUser: (u: AuthUserPayload | null) => void;
  hydrate: () => Promise<void>;
  /** Sync session from GET /auth/me (e.g. after deletion schedule changes). */
  refreshUser: () => Promise<void>;
  /** Clear tokens + client state without calling the server (e.g. invalid refresh, deleted account). */
  logoutLocal: () => Promise<void>;
  login: (p: LoginPayload) => Promise<void>;
  register: (p: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

async function syncConsentIfPossible() {
  const bundle = useLegalStore.getState().bundle;
  if (bundle?.terms?.version && bundle?.privacy?.version) {
    try {
      await recordMobileConsent(bundle.terms.version, bundle.privacy.version);
    } catch {
      /* best-effort */
    }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,

  setUser: (user) => set({ user }),

  hydrate: async () => {
    try {
      const { data } = await api.get<{ user: AuthUserPayload }>('/auth/me');
      set({ user: data.user, hydrated: true });
      if (data.user.role === 'MOBILE_USER') {
        void usePremiumEntitlementStore.getState().fetchEntitlements(true);
      }
    } catch {
      await clearTokens();
      usePremiumEntitlementStore.getState().reset();
      set({ user: null, hydrated: true });
    }
  },

  refreshUser: async () => {
    try {
      const { data } = await api.get<{ user: AuthUserPayload }>('/auth/me');
      set({ user: data.user });
      if (data.user.role === 'MOBILE_USER') {
        void usePremiumEntitlementStore.getState().fetchEntitlements(true);
      }
    } catch {
      await clearTokens();
      usePremiumEntitlementStore.getState().reset();
      set({ user: null });
    }
  },

  logoutLocal: async () => {
    await clearTokens();
    usePremiumEntitlementStore.getState().reset();
    set({ user: null });
  },

  login: async (p) => {
    const body =
      'email' in p
        ? { email: p.email.trim().toLowerCase(), password: p.password }
        : { phone: p.phone.trim(), password: p.password };
    const { data } = await api.post<AuthTokensResponse>('/auth/login', {
      ...body,
      deviceInfo: 'RuhiyatMobile',
    });
    await saveTokens(data.accessToken, data.refreshToken);
    set({ user: data.user });
    await syncConsentIfPossible();
    if (data.user.role === 'MOBILE_USER') {
      void usePremiumEntitlementStore.getState().fetchEntitlements(true);
    }
  },

  register: async (p) => {
    const { data } = await api.post<AuthTokensResponse>('/auth/register', {
      ...p,
      deviceInfo: 'RuhiyatMobile',
    });
    await saveTokens(data.accessToken, data.refreshToken);
    set({ user: data.user });
    await syncConsentIfPossible();
    if (data.user.role === 'MOBILE_USER') {
      void usePremiumEntitlementStore.getState().fetchEntitlements(true);
    }
  },

  logout: async () => {
    try {
      const { getRefreshToken } = await import('~/lib/auth-token');
      const refresh = await getRefreshToken();
      if (refresh) {
        await api.post('/auth/logout', { refreshToken: refresh });
      }
    } catch {
      /* ignore */
    }
    await useAuthStore.getState().logoutLocal();
  },
}));
