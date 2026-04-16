import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'ruhiyat_font_scale_v1';

/** 1 = 100%, 1.35 ≈ katta matn */
export const FONT_SCALE_STEPS = [1, 1.1, 1.15, 1.25, 1.35] as const;

type State = {
  fontScale: number;
  hydrated: boolean;
  setFontScale: (n: number) => void;
  hydrate: () => Promise<void>;
};

function clampScale(n: number): number {
  const steps = FONT_SCALE_STEPS as readonly number[];
  if (!Number.isFinite(n)) return 1;
  let closest = steps[0];
  for (const s of steps) {
    if (Math.abs(s - n) < Math.abs(closest - n)) closest = s;
  }
  return closest;
}

export const useAccessibilityStore = create<State>((set) => ({
  fontScale: 1,
  hydrated: false,
  setFontScale: (n) => {
    const v = clampScale(n);
    set({ fontScale: v });
    void AsyncStorage.setItem(STORAGE_KEY, String(v));
  },
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        const n = parseFloat(raw);
        if (Number.isFinite(n)) set({ fontScale: clampScale(n) });
      }
    } finally {
      set({ hydrated: true });
    }
  },
}));
