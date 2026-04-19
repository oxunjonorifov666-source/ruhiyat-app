import { create } from 'zustand';
import { fetchMyEntitlements } from '~/lib/monetizationApi';
import { getApiErrorMessage } from '~/lib/errors';
import type { MonetizationEntitlements } from '~/types/monetization';

type State = {
  entitlements: MonetizationEntitlements | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchEntitlements: (force?: boolean) => Promise<void>;
  reset: () => void;
};

export const usePremiumEntitlementStore = create<State>((set, get) => ({
  entitlements: null,
  loading: false,
  error: null,
  lastFetchedAt: null,

  fetchEntitlements: async (force) => {
    const prev = get().lastFetchedAt;
    if (!force && prev && Date.now() - prev < 15_000) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const entitlements = await fetchMyEntitlements();
      set({ entitlements, loading: false, error: null, lastFetchedAt: Date.now() });
    } catch (e) {
      set({
        entitlements: null,
        loading: false,
        error: getApiErrorMessage(e),
        lastFetchedAt: Date.now(),
      });
    }
  },

  reset: () => set({ entitlements: null, loading: false, error: null, lastFetchedAt: null }),
}));
