import { create } from "zustand";

export type InAppNotificationPayload = {
  id: string;
  title: string;
  body: string;
};

export const useInAppNotificationStore = create<{
  queue: InAppNotificationPayload[];
  push: (title: string, body: string) => void;
  shift: () => void;
}>((set) => ({
  queue: [],
  push: (title, body) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set((s) => ({ queue: [...s.queue, { id, title, body }] }));
  },
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));
