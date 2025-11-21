import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Disciplina } from '../types';
import { savePlanningConfig, getPlanningConfig } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';

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
  fetchPlanningConfig: (studyPlanId: string) => Promise<void>;
  savePlanningConfigToDb: () => Promise<void>;
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
      setPlanningConfig: (config) => {
        set({ planningConfig: config });
        // Salva automaticamente no banco quando config muda (em segundo plano)
        get().savePlanningConfigToDb().catch(err => {
          console.error("Erro ao salvar planning config:", err);
        });
      },
      syncWeightsWithDisciplinas: (disciplinas) => {
        const currentConfig = get().planningConfig;
        const currentWeights = currentConfig?.planConfig?.weights || {};
        const newWeights: Record<string, number> = {};

        // Keep existing weights for current disciplines, remove old ones, add new ones
        for (const disciplina of disciplinas) {
          newWeights[disciplina.nome] = currentWeights[disciplina.nome] || 10; // Default to 10 if new
        }
        
        const newConfig = {
          ...currentConfig,
          planConfig: {
            ...currentConfig?.planConfig,
            weights: newWeights,
          }
        };
        
        set({ planningConfig: newConfig });
        // Salva automaticamente no banco (em segundo plano)
        get().savePlanningConfigToDb().catch(err => {
          console.error("Erro ao salvar planning config:", err);
        });
      },
      fetchPlanningConfig: async (studyPlanId: string) => {
        try {
          const config = await getPlanningConfig(studyPlanId);
          if (config) {
            set({ planningConfig: config });
          }
        } catch (error) {
          console.error("Failed to fetch planning config:", error);
          // Não mostra erro para o usuário, apenas usa o padrão
        }
      },
      savePlanningConfigToDb: async () => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        const config = get().planningConfig;
        if (!studyPlanId || !config) return;
        
        try {
          await savePlanningConfig(studyPlanId, config);
        } catch (error) {
          console.error("Failed to save planning config:", error);
          toast.error("Falha ao salvar configuração de planejamento.");
        }
      },
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