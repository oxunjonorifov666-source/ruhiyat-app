import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_ENABLED = 'ruhiyat_app_lock_enabled_v1';
const KEY_PIN = 'ruhiyat_app_pin_v1';

type State = {
  enabled: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearLock: () => Promise<void>;
  setEnabledFlag: (v: boolean) => Promise<void>;
};

export const useAppLockStore = create<State>((set, get) => ({
  enabled: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const en = await SecureStore.getItemAsync(KEY_ENABLED);
      const pin = await SecureStore.getItemAsync(KEY_PIN);
      set({ enabled: en === 'true' && !!pin });
    } finally {
      set({ hydrated: true });
    }
  },

  setEnabledFlag: async (v: boolean) => {
    await SecureStore.setItemAsync(KEY_ENABLED, v ? 'true' : 'false');
    set({ enabled: v });
  },

  setPin: async (pin: string) => {
    const p = pin.replace(/\D/g, '');
    if (p.length < 4 || p.length > 6) {
      throw new Error('PIN 4–6 raqamdan iborat bo‘lishi kerak');
    }
    await SecureStore.setItemAsync(KEY_PIN, p);
    await SecureStore.setItemAsync(KEY_ENABLED, 'true');
    set({ enabled: true });
  },

  verifyPin: async (pin: string) => {
    const stored = await SecureStore.getItemAsync(KEY_PIN);
    return stored != null && stored === pin.replace(/\D/g, '');
  },

  clearLock: async () => {
    await SecureStore.deleteItemAsync(KEY_PIN).catch(() => undefined);
    await SecureStore.setItemAsync(KEY_ENABLED, 'false');
    set({ enabled: false });
  },
}));
