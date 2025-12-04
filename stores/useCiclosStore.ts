
import { create } from 'zustand';
<<<<<<< HEAD
import { Ciclo, SessaoCiclo, SessaoEstudo } from '../types';
=======
import { Ciclo, SessaoCiclo } from '../types';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
import { getCiclos, createCiclo, updateCicloApi, deleteCiclo } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { toast } from '../components/Sonner';

interface CiclosState {
<<<<<<< HEAD
    ciclos: Ciclo[];
    cicloAtivoId: string | null;
    loading: boolean;
    ultimaSessaoConcluidaId: string | null; // Novo estado para rastrear progresso

    fetchCiclos: (studyPlanId: string) => Promise<void>;
    getCicloAtivo: () => Ciclo | null;
    setCicloAtivoId: (id: string | null) => void;
    setUltimaSessaoConcluida: (cicloId: string, sessaoId: string) => void;
    syncProgressoComSessoes: (sessoes: SessaoEstudo[]) => void;
    addCiclo: (cicloData: Omit<Ciclo, 'id' | 'studyPlanId'>) => Promise<Ciclo>;
    updateCiclo: (id: string, updates: Partial<Omit<Ciclo, 'id'>>) => Promise<void>;
    removeCiclo: (id: string) => void;
    addSessaoAoCiclo: (cicloId: string, disciplinaId: string, tempoPrevisto: number) => Promise<void>;
    reordenarSessao: (cicloId: string, sessaoId: string, direcao: 'up' | 'down') => Promise<void>;
    removeSessaoDoCiclo: (cicloId: string, sessaoId: string) => Promise<void>;
    removeSessoesPorDisciplina: (disciplinaId: string) => void;
}

export const useCiclosStore = create<CiclosState>((set, get) => ({
    ciclos: [],
    cicloAtivoId: null,
    loading: false,
    ultimaSessaoConcluidaId: null,

    // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
    fetchCiclos: async (studyPlanId: string) => {
=======
  ciclos: Ciclo[];
  cicloAtivoId: string | null;
  loading: boolean;
  ultimaSessaoConcluidaId: string | null; // Novo estado para rastrear progresso
  
  fetchCiclos: (studyPlanId: string) => Promise<void>;
  getCicloAtivo: () => Ciclo | null;
  setCicloAtivoId: (id: string | null) => void;
  setUltimaSessaoConcluida: (cicloId: string, sessaoId: string) => void;
  addCiclo: (cicloData: Omit<Ciclo, 'id' | 'studyPlanId'>) => Promise<Ciclo>;
  updateCiclo: (id: string, updates: Partial<Omit<Ciclo, 'id'>>) => Promise<void>;
  removeCiclo: (id: string) => void;
  addSessaoAoCiclo: (cicloId: string, disciplinaId: string, tempoPrevisto: number) => Promise<void>;
  reordenarSessao: (cicloId: string, sessaoId: string, direcao: 'up' | 'down') => Promise<void>;
  removeSessaoDoCiclo: (cicloId: string, sessaoId: string) => Promise<void>;
  removeSessoesPorDisciplina: (disciplinaId: string) => void;
}

export const useCiclosStore = create<CiclosState>((set, get) => ({
      ciclos: [],
      cicloAtivoId: null,
      loading: false,
      ultimaSessaoConcluidaId: null,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchCiclos: async (studyPlanId: string) => {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        set({ loading: true });
        try {
            const ciclos = await getCiclos(studyPlanId);
            set({ ciclos });
            if (!get().cicloAtivoId && ciclos.length > 0) {
                set({ cicloAtivoId: ciclos[0].id });
            }
<<<<<<< HEAD
            // Tenta carregar o último estado do localStorage (simulado)
=======
             // Tenta carregar o último estado do localStorage (simulado)
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
            const savedProgress = localStorage.getItem(`ciclo-progress-${ciclos[0]?.id}`);
            if (savedProgress) {
                set({ ultimaSessaoConcluidaId: JSON.parse(savedProgress) });
            }

        } catch (error) {
            console.error("Failed to fetch ciclos:", error);
            toast.error("Não foi possível carregar os ciclos de estudo.");
        } finally {
            set({ loading: false });
        }
<<<<<<< HEAD
    },

    getCicloAtivo: () => {
        const { ciclos, cicloAtivoId } = get();
        return ciclos.find(c => c.id === cicloAtivoId) || null;
    },
    setCicloAtivoId: (id) => {
=======
      },

      getCicloAtivo: () => {
        const { ciclos, cicloAtivoId } = get();
        return ciclos.find(c => c.id === cicloAtivoId) || null;
      },
      setCicloAtivoId: (id) => {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        set({ cicloAtivoId: id, ultimaSessaoConcluidaId: null });
        if (id) {
            const savedProgress = localStorage.getItem(`ciclo-progress-${id}`);
            if (savedProgress) {
                set({ ultimaSessaoConcluidaId: JSON.parse(savedProgress) });
            }
        }
<<<<<<< HEAD
    },
    setUltimaSessaoConcluida: (cicloId, sessaoId) => {
        set({ ultimaSessaoConcluidaId: sessaoId });
        // Simula persistência no localStorage
        localStorage.setItem(`ciclo-progress-${cicloId}`, JSON.stringify(sessaoId));
    },
    syncProgressoComSessoes: (sessoes) => {
        const { ciclos, cicloAtivoId } = get();
        if (!cicloAtivoId) return;

        const cicloAtivo = ciclos.find(c => c.id === cicloAtivoId);
        if (!cicloAtivo || !cicloAtivo.sessoes || cicloAtivo.sessoes.length === 0) return;

        // Ordenar sessões do ciclo por ordem
        const sessoesOrdenadas = [...cicloAtivo.sessoes].sort((a, b) => a.ordem - b.ordem);

        // Identificar quais sessões do ciclo foram concluídas
        const sessoesConcluidasIds = new Set<string>();

        sessoes.forEach(sessao => {
            // Verificar se a sessão referencia uma sessão do ciclo via topico_id
            if (sessao.topico_id.startsWith('ciclo-')) {
                const sessaoCicloId = sessao.topico_id.replace('ciclo-', '');
                if (sessoesOrdenadas.some(s => s.id === sessaoCicloId)) {
                    sessoesConcluidasIds.add(sessaoCicloId);
                }
            }

            // Verificar se a sessão referencia uma sessão do ciclo via comentários
            if (sessao.comentarios) {
                const match = sessao.comentarios.match(/CICLO_SESSAO_ID:([^\s|]+)/);
                if (match && match[1]) {
                    const sessaoCicloId = match[1];
                    if (sessoesOrdenadas.some(s => s.id === sessaoCicloId)) {
                        sessoesConcluidasIds.add(sessaoCicloId);
                    }
                }
            }
        });

        // Encontrar a última sessão concluída na ordem do ciclo
        let ultimaSessaoConcluidaId: string | null = null;
        for (let i = sessoesOrdenadas.length - 1; i >= 0; i--) {
            if (sessoesConcluidasIds.has(sessoesOrdenadas[i].id)) {
                ultimaSessaoConcluidaId = sessoesOrdenadas[i].id;
                break;
            }
        }

        // Atualizar o estado se houver mudança
        if (ultimaSessaoConcluidaId !== get().ultimaSessaoConcluidaId) {
            set({ ultimaSessaoConcluidaId });
            localStorage.setItem(`ciclo-progress-${cicloAtivoId}`, JSON.stringify(ultimaSessaoConcluidaId));
        }
    },
    addCiclo: async (cicloData) => {
=======
      },
      setUltimaSessaoConcluida: (cicloId, sessaoId) => {
          set({ ultimaSessaoConcluidaId: sessaoId });
           // Simula persistência no localStorage
          localStorage.setItem(`ciclo-progress-${cicloId}`, JSON.stringify(sessaoId));
      },
      addCiclo: async (cicloData) => {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) throw new Error("Plano de estudo não selecionado.");

        try {
            const novoCiclo = await createCiclo(studyPlanId, cicloData);
            set(state => ({ ciclos: [...state.ciclos, novoCiclo] }));
            return novoCiclo;
<<<<<<< HEAD
        } catch (e) {
            toast.error("Falha ao criar ciclo.");
            throw e;
        }
    },
    updateCiclo: async (id, updates) => {
=======
        } catch(e) {
            toast.error("Falha ao criar ciclo.");
            throw e;
        }
      },
      updateCiclo: async (id, updates) => {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        try {
            const cicloAtualizado = await updateCicloApi(id, updates);
            set(state => ({
                ciclos: state.ciclos.map(c => c.id === id ? cicloAtualizado : c),
            }));
        } catch (e) {
            toast.error("Falha ao atualizar ciclo.");
            throw e;
        }
<<<<<<< HEAD
    },
    removeCiclo: async (id) => {
=======
      },
      removeCiclo: async (id) => {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        try {
            await deleteCiclo(id);
            localStorage.removeItem(`ciclo-progress-${id}`);
            set(state => ({
<<<<<<< HEAD
                ciclos: state.ciclos.filter(c => c.id !== id),
                cicloAtivoId: state.cicloAtivoId === id ? state.ciclos[0]?.id || null : state.cicloAtivoId,
=======
              ciclos: state.ciclos.filter(c => c.id !== id),
              cicloAtivoId: state.cicloAtivoId === id ? state.ciclos[0]?.id || null : state.cicloAtivoId,
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
            }));
        } catch (e) {
            toast.error("Falha ao remover ciclo.");
        }
<<<<<<< HEAD
    },
    addSessaoAoCiclo: async (cicloId, disciplinaId, tempoPrevisto) => {
        const ciclo = get().ciclos.find(c => c.id === cicloId);
        if (!ciclo) return;
        const sessoesAtuais = ciclo.sessoes || [];
        const novaSessao: Omit<SessaoCiclo, 'id'> & { id?: string } = {
            disciplina_id: disciplinaId,
            tempo_previsto: tempoPrevisto,
            ordem: sessoesAtuais.length,
        };
        await get().updateCiclo(cicloId, { sessoes: [...sessoesAtuais, novaSessao as SessaoCiclo] });
    },
    reordenarSessao: async (cicloId, sessaoId, direcao) => {
=======
      },
      addSessaoAoCiclo: async (cicloId, disciplinaId, tempoPrevisto) => {
          const ciclo = get().ciclos.find(c => c.id === cicloId);
          if(!ciclo) return;
          const sessoesAtuais = ciclo.sessoes || [];
          const novaSessao: Omit<SessaoCiclo, 'id'> & { id?: string } = {
              disciplina_id: disciplinaId,
              tempo_previsto: tempoPrevisto,
              ordem: sessoesAtuais.length,
          };
          await get().updateCiclo(cicloId, { sessoes: [...sessoesAtuais, novaSessao as SessaoCiclo] });
      },
      reordenarSessao: async (cicloId, sessaoId, direcao) => {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        const ciclo = get().ciclos.find(c => c.id === cicloId);
        if (!ciclo || !ciclo.sessoes) return;

        const sessoes = [...ciclo.sessoes];
        const index = sessoes.findIndex(s => s.id === sessaoId);

        if (direcao === 'up' && index > 0) {
            [sessoes[index], sessoes[index - 1]] = [sessoes[index - 1], sessoes[index]];
        } else if (direcao === 'down' && index < sessoes.length - 1) {
            [sessoes[index], sessoes[index + 1]] = [sessoes[index + 1], sessoes[index]];
        }
<<<<<<< HEAD

        const sessoesReordenadas = sessoes.map((s, i) => ({ ...s, ordem: i }));
        await get().updateCiclo(cicloId, { sessoes: sessoesReordenadas });
    },
    removeSessaoDoCiclo: async (cicloId, sessaoId) => {
        const ciclo = get().ciclos.find(c => c.id === cicloId);
        if (!ciclo || !ciclo.sessoes) return;
        const sessoesAtualizadas = ciclo.sessoes
            .filter(s => s.id !== sessaoId)
            .map((s, i) => ({ ...s, ordem: i })); // Reajusta a ordem
        await get().updateCiclo(cicloId, { sessoes: sessoesAtualizadas });
    },
    removeSessoesPorDisciplina: (disciplinaId) => {
        get().ciclos.forEach(ciclo => {
            const sessoesFiltradas = (ciclo.sessoes || []).filter(s => s.disciplina_id !== disciplinaId);
            if (sessoesFiltradas.length < (ciclo.sessoes || []).length) {
                get().updateCiclo(ciclo.id, { sessoes: sessoesFiltradas });
            }
        });
    },
})
=======
        
        const sessoesReordenadas = sessoes.map((s, i) => ({ ...s, ordem: i }));
        await get().updateCiclo(cicloId, { sessoes: sessoesReordenadas });
      },
      removeSessaoDoCiclo: async (cicloId, sessaoId) => {
          const ciclo = get().ciclos.find(c => c.id === cicloId);
          if(!ciclo || !ciclo.sessoes) return;
          const sessoesAtualizadas = ciclo.sessoes
            .filter(s => s.id !== sessaoId)
            .map((s, i) => ({ ...s, ordem: i })); // Reajusta a ordem
          await get().updateCiclo(cicloId, { sessoes: sessoesAtualizadas });
      },
      removeSessoesPorDisciplina: (disciplinaId) => {
          get().ciclos.forEach(ciclo => {
              const sessoesFiltradas = (ciclo.sessoes || []).filter(s => s.disciplina_id !== disciplinaId);
              if(sessoesFiltradas.length < (ciclo.sessoes || []).length) {
                  get().updateCiclo(ciclo.id, { sessoes: sessoesFiltradas });
              }
          });
      },
    })
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
);
