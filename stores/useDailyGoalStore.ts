import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DailyGoalStore {
  goalMinutes: number;
  _hasHydrated: boolean;
  setGoalMinutes: (minutes: number) => void;
}

export const useDailyGoalStore = create<DailyGoalStore>()(
  persist(
    (set) => ({
      goalMinutes: 240, // Defaulting to 4 hours
      _hasHydrated: false,
      setGoalMinutes: (minutes) => set({ goalMinutes: minutes }),
    }),
    {
      name: 'evolui-daily-goal-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);