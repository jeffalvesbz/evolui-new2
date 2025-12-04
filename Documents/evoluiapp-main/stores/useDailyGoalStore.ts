import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DailyGoalStore {
  goalMinutes: number;
  weeklyGoalHours: number;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setGoalMinutes: (minutes: number) => void;
  setWeeklyGoalHours: (hours: number) => void;
}

export const useDailyGoalStore = create<DailyGoalStore>()(
  persist(
    (set) => ({
      goalMinutes: 240, // Defaulting to 4 hours
      weeklyGoalHours: 20, // Defaulting to 20 hours
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setGoalMinutes: (minutes) => set({ goalMinutes: Math.min(minutes, 720) }), // Máximo de 12h (720 minutos)
      setWeeklyGoalHours: (hours) => set({ weeklyGoalHours: hours }),
    }),
    {
      name: 'evolui-daily-goal-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
            // Limitar meta diária a no máximo 12h (720 minutos) ao reidratar
            if (state.goalMinutes > 720) {
                state.goalMinutes = 720;
            }
            state.setHasHydrated(true);
        }
      },
    }
  )
);