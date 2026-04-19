import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Draft = {
  /** questionId -> answerId */
  answers: Record<number, number>;
  updatedAt: number;
};

type State = {
  byTestId: Record<string, Draft>;
  setAnswer: (testId: number, questionId: number, answerId: number) => void;
  clearDraft: (testId: number) => void;
};

export const useTestDraftStore = create<State>()(
  persist(
    (set, get) => ({
      byTestId: {},

      setAnswer: (testId, questionId, answerId) => {
        const key = String(testId);
        const prev = get().byTestId[key]?.answers ?? {};
        set({
          byTestId: {
            ...get().byTestId,
            [key]: {
              answers: { ...prev, [questionId]: answerId },
              updatedAt: Date.now(),
            },
          },
        });
      },

      clearDraft: (testId) => {
        const key = String(testId);
        const { [key]: _, ...rest } = get().byTestId;
        set({ byTestId: rest });
      },
    }),
    {
      name: 'ruhiyat-test-drafts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ byTestId: s.byTestId }),
    },
  ),
);
