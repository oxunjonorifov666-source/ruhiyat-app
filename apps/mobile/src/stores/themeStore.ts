import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'ruhiyat_theme_mode_v1';

type State = {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (m: ThemeMode) => void;
  /** Eski kod: faqat yorug‘ ↔ qorong‘u */
  toggle: () => void;
  hydrate: () => Promise<void>;
};

export const useThemeStore = create<State>((set, get) => ({
  mode: 'light',
  hydrated: false,
  setMode: (m) => {
    set({ mode: m });
    void AsyncStorage.setItem(STORAGE_KEY, m);
  },
  toggle: () => {
    const cur = get().mode;
    const next = cur === 'light' ? 'dark' : 'light';
    get().setMode(next);
  },
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark' || v === 'system') {
        set({ mode: v });
      }
    } finally {
      set({ hydrated: true });
    }
  },
}));
