import { create } from 'zustand';

/** PIN qulfining 5 daqiqalik faolsizlik uchun oxirgi faollik vaqti */
export const useAppActivityStore = create<{
  lastActivityAt: number;
  touch: () => void;
}>((set) => ({
  lastActivityAt: Date.now(),
  touch: () => set({ lastActivityAt: Date.now() }),
}));
