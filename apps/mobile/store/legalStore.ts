import { create } from 'zustand';
import { fetchPublicLegalBundle } from '~/lib/legal';
import type { PublicLegalBundle } from '~/types/legal';

type LegalState = {
  bundle: PublicLegalBundle | null;
  loading: boolean;
  error: string | null;
  load: (region?: string) => Promise<void>;
  reset: () => void;
};

export const useLegalStore = create<LegalState>((set) => ({
  bundle: null,
  loading: false,
  error: null,
  async load(region = 'GLOBAL') {
    set({ loading: true, error: null });
    try {
      const bundle = await fetchPublicLegalBundle(region);
      set({ bundle, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Yuklash muvaffaqiyatsiz';
      set({ error: msg, loading: false });
    }
  },
  reset: () => set({ bundle: null, error: null, loading: false }),
}));
