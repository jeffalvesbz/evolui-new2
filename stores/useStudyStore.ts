import { create } from 'zustand';
import { Simulation } from '../types';
import { getSimulados, createSimulado, updateSimuladoApi, deleteSimulado } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';

interface StudyStore {
  simulations: Simulation[];
  loading: boolean;
  fetchSimulados: (editalId: string) => Promise<void>;
  addSimulation: (simulation: Omit<Simulation, 'id'>) => Promise<Simulation>;
  updateSimulation: (id: string, updates: Partial<Simulation>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
}

export const useStudyStore = create<StudyStore>((set, get) => ({
      simulations: [],
      loading: false,

      fetchSimulados: async (editalId: string) => {
        set({ loading: true });
        try {
          const simulations = await getSimulados(editalId);
          set({ simulations });
        } catch (error) {
          console.error("Failed to fetch simulations:", error);
          toast.error("Não foi possível carregar os simulados.");
        } finally {
          set({ loading: false });
        }
      },

      addSimulation: async (simulationData) => {
        const editalAtivoId = useEditalStore.getState().editalAtivo?.id;
        if (!editalAtivoId) throw new Error("Edital não selecionado.");

        try {
            const newSimulation = await createSimulado(editalAtivoId, simulationData);
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
                sim.id === id ? updatedSimulation : sim
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