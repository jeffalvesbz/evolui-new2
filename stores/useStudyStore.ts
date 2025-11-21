
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
  duration_minutes: number; // Campo do banco em snake_case
  notes?: string;
  date: string; // ISO string
  studyPlanId: string; // Campo mapeado do banco
  is_cebraspe?: boolean; // Campo do banco em snake_case
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
        if (!studyPlanId) {
          console.warn("fetchSimulados: studyPlanId não fornecido");
          set({ simulations: [], loading: false });
          return;
        }
        
        set({ loading: true });
        try {
          const data = await getSimulados(studyPlanId);
          set({ simulations: data || [] });
        } catch (error: any) {
          console.error("Failed to fetch simulations:", error);
          // Se for erro 400, pode ser problema de permissões ou schema - não quebrar a aplicação
          if (error?.status === 400 || error?.code === 'PGRST116') {
            console.warn("Erro 400 ao buscar simulados - pode ser problema de permissões ou schema do Supabase");
            set({ simulations: [] });
          } else {
            toast.error("Não foi possível carregar os simulados.");
            set({ simulations: [] });
          }
        } finally {
          set({ loading: false });
        }
      },

      addSimulation: async (simulationData) => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) {
            toast.error("Plano de estudo não selecionado.");
            throw new Error("Plano de estudo não selecionado.");
        }

        try {
            const newSimulation = await createSimulado(studyPlanId, simulationData);
            set(state => ({ simulations: [...state.simulations, newSimulation] }));
            toast.success("Simulado adicionado com sucesso!");
            return newSimulation;
        } catch (error: any) {
            console.error("Erro ao adicionar simulado:", error);
            const errorMsg = error?.message || "Não foi possível salvar o simulado.";
            toast.error(errorMsg);
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
