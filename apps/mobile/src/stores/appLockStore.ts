import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY_ENABLED = 'ruhiyat_app_lock_enabled_v1';
const KEY_PIN = 'ruhiyat_app_pin_v1';
/** Birinchi marta majburiy 4 raqamli PIN yaratilgan */
const KEY_MANDATORY_PIN_DONE = 'ruhiyat_mandatory_pin_done_v1';
const KEY_FAIL_COUNT = 'ruhiyat_pin_fail_count_v1';

export const PIN_LENGTH = 4;
export const MAX_PIN_ATTEMPTS = 5;
export const APP_LOCK_IDLE_MS = 5 * 60 * 1000;

type State = {
  enabled: boolean;
  hydrated: boolean;
  mandatoryPinDone: boolean;
  failCount: number;
  /** Saqlangan PIN uzunligi (4–6, eski foydalanuvchilar bilan mos) */
  storedPinLength: number;
  hydrate: () => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  clearLock: () => Promise<void>;
  setEnabledFlag: (v: boolean) => Promise<void>;
  markMandatoryPinDone: () => Promise<void>;
  resetFailCount: () => Promise<void>;
  incrementFailCount: () => Promise<number>;
};

export const useAppLockStore = create<State>((set, get) => ({
  enabled: false,
  hydrated: false,
  mandatoryPinDone: false,
  failCount: 0,
  storedPinLength: PIN_LENGTH,

  hydrate: async () => {
    try {
      const en = await SecureStore.getItemAsync(KEY_ENABLED);
      const pin = await SecureStore.getItemAsync(KEY_PIN);
      const mandatory = await SecureStore.getItemAsync(KEY_MANDATORY_PIN_DONE);
      const fails = await SecureStore.getItemAsync(KEY_FAIL_COUNT);
      const pl = pin ? Math.min(6, Math.max(4, pin.length)) : PIN_LENGTH;
      set({
        enabled: en === 'true' && !!pin,
        mandatoryPinDone: mandatory === 'true' || (!!pin && en === 'true'),
        failCount: Math.min(MAX_PIN_ATTEMPTS, parseInt(fails || '0', 10) || 0),
        storedPinLength: pl,
      });
    } finally {
      set({ hydrated: true });
    }
  },

  setEnabledFlag: async (v: boolean) => {
    await SecureStore.setItemAsync(KEY_ENABLED, v ? 'true' : 'false');
    set({ enabled: v });
  },

  markMandatoryPinDone: async () => {
    await SecureStore.setItemAsync(KEY_MANDATORY_PIN_DONE, 'true');
    set({ mandatoryPinDone: true });
  },

  setPin: async (pin: string) => {
    const p = pin.replace(/\D/g, '');
    if (p.length !== PIN_LENGTH) {
      throw new Error(`PIN ${PIN_LENGTH} ta raqamdan iborat bo‘lishi kerak`);
    }
    await SecureStore.setItemAsync(KEY_PIN, p);
    await SecureStore.setItemAsync(KEY_ENABLED, 'true');
    await SecureStore.deleteItemAsync(KEY_FAIL_COUNT).catch(() => undefined);
    set({ enabled: true, failCount: 0, storedPinLength: PIN_LENGTH });
  },

  verifyPin: async (pin: string) => {
    const stored = await SecureStore.getItemAsync(KEY_PIN);
    return stored != null && stored === pin.replace(/\D/g, '');
  },

  resetFailCount: async () => {
    await SecureStore.deleteItemAsync(KEY_FAIL_COUNT).catch(() => undefined);
    set({ failCount: 0 });
  },

  incrementFailCount: async () => {
    const n = get().failCount + 1;
    await SecureStore.setItemAsync(KEY_FAIL_COUNT, String(n));
    set({ failCount: n });
    return n;
  },

  clearLock: async () => {
    await SecureStore.deleteItemAsync(KEY_PIN).catch(() => undefined);
    await SecureStore.setItemAsync(KEY_ENABLED, 'false');
    await SecureStore.deleteItemAsync(KEY_FAIL_COUNT).catch(() => undefined);
    set({ enabled: false, failCount: 0 });
  },
}));
