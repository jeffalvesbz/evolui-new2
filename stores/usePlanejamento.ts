import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Disciplina } from '../types';

// Based on usage in useCicloRotativo
interface PlanningConfig {
  planConfig?: {
    weights?: Record<string, number>;
  };
}

interface PlanejamentoState {
  planningConfig: PlanningConfig | null;
  _hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  setPlanningConfig: (config: PlanningConfig) => void;
  syncWeightsWithDisciplinas: (disciplinas: Disciplina[]) => void;
}

const initialPlanningConfig: PlanningConfig = {
    planConfig: {
        weights: {}
    }
}


export const usePlanejamento = create<PlanejamentoState>()(
  persist(
    (set, get) => ({
      planningConfig: initialPlanningConfig,
      _hasHydrated: false,
      setHasHydrated: (hydrated) => set({ _hasHydrated: hydrated }),
      setPlanningConfig: (config) => set({ planningConfig: config }),
      syncWeightsWithDisciplinas: (disciplinas) => {
        const currentConfig = get().planningConfig;
        const currentWeights = currentConfig?.planConfig?.weights || {};
        const newWeights: Record<string, number> = {};

        // Keep existing weights for current disciplines, remove old ones, add new ones
        for (const disciplina of disciplinas) {
          newWeights[disciplina.nome] = currentWeights[disciplina.nome] || 10; // Default to 10 if new
        }
        
        set({
          planningConfig: {
            ...currentConfig,
            planConfig: {
              ...currentConfig?.planConfig,
              weights: newWeights,
            }
          }
        });
      }
    }),
    {
      name: 'evolui-planejamento-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (state) {
            state.setHasHydrated(true);
        }
      },
    }
  )
);