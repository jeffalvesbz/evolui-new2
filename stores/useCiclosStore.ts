import { create } from 'zustand';
import { Ciclo, SessaoCiclo } from '../types';
import { getCiclos, createCiclo, updateCicloApi, deleteCiclo } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';

interface CiclosState {
  ciclos: Ciclo[];
  cicloAtivoId: string | null;
  loading: boolean;
  
  fetchCiclos: (editalId: string) => Promise<void>;
  getCicloAtivo: () => Ciclo | null;
  setCicloAtivoId: (id: string | null) => void;
  addCiclo: (cicloData: Omit<Ciclo, 'id' | 'studyPlanId'>) => Promise<Ciclo>;
  updateCiclo: (id: string, nome: string) => void;
  removeCiclo: (id: string) => void;
  addSessaoAoCiclo: (cicloId: string, disciplinaId: string, tempoPrevisto: number) => void;
  updateSessaoNoCiclo: (cicloId: string, sessaoId: string, updates: Partial<Omit<SessaoCiclo, 'id'>>) => void;
  removeSessaoDoCiclo: (cicloId: string, sessaoId: string) => void;
  removeSessoesPorDisciplina: (disciplinaId: string) => void;
}

export const useCiclosStore = create<CiclosState>((set, get) => ({
      ciclos: [],
      cicloAtivoId: null,
      loading: false,

      fetchCiclos: async (editalId: string) => {
        set({ loading: true });
        try {
            const ciclos = await getCiclos(editalId);
            set({ ciclos });
            if (!get().cicloAtivoId && ciclos.length > 0) {
                set({ cicloAtivoId: ciclos[0].id });
            }
        } catch (error) {
            console.error("Failed to fetch ciclos:", error);
            toast.error("Não foi possível carregar os ciclos de estudo.");
        } finally {
            set({ loading: false });
        }
      },

      getCicloAtivo: () => {
        const { ciclos, cicloAtivoId } = get();
        return ciclos.find(c => c.id === cicloAtivoId) || null;
      },
      setCicloAtivoId: (id) => set({ cicloAtivoId: id }),
      addCiclo: async (cicloData) => {
        const editalAtivoId = useEditalStore.getState().editalAtivo?.id;
        if (!editalAtivoId) throw new Error("Edital não selecionado.");

        try {
            const novoCiclo = await createCiclo(editalAtivoId, cicloData);
            set(state => ({ ciclos: [...state.ciclos, novoCiclo] }));
            return novoCiclo;
        } catch(e) {
            toast.error("Falha ao criar ciclo.");
            throw e;
        }
      },
      updateCiclo: async (id, nome) => {
        const ciclo = get().getCicloAtivo();
        if(!ciclo) return;
        try {
            const cicloAtualizado = await updateCicloApi(id, { ...ciclo, nome });
            set(state => ({
                ciclos: state.ciclos.map(c => c.id === id ? cicloAtualizado : c),
            }));
        } catch (e) {
            toast.error("Falha ao atualizar ciclo.");
        }
      },
      removeCiclo: async (id) => {
        try {
            await deleteCiclo(id);
            set(state => ({
              ciclos: state.ciclos.filter(c => c.id !== id),
              cicloAtivoId: state.cicloAtivoId === id ? state.ciclos[0]?.id || null : state.cicloAtivoId,
            }));
        } catch (e) {
            toast.error("Falha ao remover ciclo.");
        }
      },

      // As ações de sessão são otimistas para melhor UX, mas idealmente teriam endpoints de API
      addSessaoAoCiclo: (cicloId, disciplinaId, tempoPrevisto) => {
        // Esta lógica deve ser movida para um endpoint de API dedicado
        console.warn("addSessaoAoCiclo should be an API call");
      },
      updateSessaoNoCiclo: (cicloId, sessaoId, updates) => {
        console.warn("updateSessaoNoCiclo should be an API call");
      },
      removeSessaoDoCiclo: (cicloId, sessaoId) => {
        console.warn("removeSessaoDoCiclo should be an API call");
      },
      removeSessoesPorDisciplina: (disciplinaId) => {
        // Esta lógica é complexa e deve ser tratada pelo backend
        console.warn("removeSessoesPorDisciplina should be handled by the backend");
      },
    })
);