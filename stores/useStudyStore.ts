

import { create } from 'zustand';
import { getSimulados, createSimulado, updateSimuladoApi, deleteSimulado } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';

export interface Simulation {
  id: string;
  name: string;
  correct: number;
  wrong: number;
  blank?: number;
  durationMinutes: number;
  notes?: string;
  date: string; // ISO string
  studyPlanId: string;
  isCebraspe?: boolean;
}

interface StudyStore {
  simulations: Simulation[];
  loading: boolean;
  fetchSimulados: (studyPlanId: string) => Promise<void>;
  addSimulation: (simulation: Omit<Simulation, 'id' | 'studyPlanId'>) => Promise<Simulation>;
  updateSimulation: (id: string, updates: Partial<Simulation>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
}

export const useStudyStore = create<StudyStore>((set, get) => ({
      simulations: [],
      loading: false,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchSimulados: async (studyPlanId: string) => {
        set({ loading: true });
        try {
          const data = await getSimulados(studyPlanId);
          const simulations: Simulation[] = data.map((sim: any) => {
            const { study_plan_id, ...rest } = sim;
            return { ...rest, studyPlanId: study_plan_id };
          });
          set({ simulations });
        } catch (error) {
          console.error("Failed to fetch simulations:", error);
          toast.error("Não foi possível carregar os simulados.");
        } finally {
          set({ loading: false });
        }
      },

      addSimulation: async (simulationData) => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) throw new Error("Plano de estudo não selecionado.");

        try {
            const newSimulation = await createSimulado(studyPlanId, simulationData);
            set(state => ({ simulations: [...state.simulations, newSimulation] }));
            return newSimulation;
        } catch (error) {
            toast.error("Falha ao adicionar simulado.");
            throw error;
        }
      },
      updateSimulation: async (id, updates) => {
        try {
            const updatedSimulation = await updateSimuladoApi(id, updates);
            set(state => ({
              simulations: state.simulations.map(sim => 
                sim.id === id ? { ...sim, ...updatedSimulation } : sim
              ),
            }));
        } catch (error) {
            toast.error("Falha ao atualizar simulado.");
            throw error;
        }
      },
      deleteSimulation: async (id) => {
        try {
            await deleteSimulado(id);
            set(state => ({
              simulations: state.simulations.filter(sim => sim.id !== id),
            }));
        } catch (error) {
            toast.error("Falha ao remover simulado.");
            throw error;
        }
      },
    })
);