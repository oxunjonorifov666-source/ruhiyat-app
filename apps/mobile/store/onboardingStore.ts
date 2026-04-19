import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type OnboardingState = {
  /** User finished welcome + legal + consent checkbox flow */
  completed: boolean;
  setCompleted: (v: boolean) => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      setCompleted: (completed) => set({ completed }),
    }),
    {
      name: 'ruhiyat-onboarding-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ completed: s.completed }),
    },
  ),
);
