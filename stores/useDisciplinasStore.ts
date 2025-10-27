import { create } from 'zustand';
import { Disciplina, Topico } from '../types';
import { getDisciplinas, createDisciplina, updateDisciplinaApi, deleteDisciplina, updateTopicoApi, createTopico } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useCiclosStore } from './useCiclosStore';
import { useGamificationStore } from './useGamificationStore';
import { checkAndAwardBadges } from '../services/badgeService';

const calculateProgress = (topicos: Topico[]): number => {
  if (topicos.length === 0) return 0;
  const concluidos = topicos.filter((t) => t.concluido).length;
  return Math.round((concluidos / topicos.length) * 100);
};

interface DisciplinasState {
  disciplinas: Disciplina[]; // Disciplinas do edital ativo
  loading: boolean;
  
  fetchDisciplinas: (editalId: string) => Promise<void>;
  addDisciplina: (disciplinaData: Omit<Disciplina, 'id' | 'progresso' | 'studyPlanId'>) => Promise<Disciplina>;
  updateDisciplina: (id: string, updates: Partial<Omit<Disciplina, 'id'>>) => Promise<void>;
  removeDisciplina: (id: string) => Promise<void>;
  addTopico: (disciplinaId: string, topicoData: Omit<Topico, 'id'>) => Promise<void>;
  updateTopico: (disciplinaId: string, topicoId: string, updates: Partial<Omit<Topico, 'id'>>) => Promise<void>;
  
  getAverageProgress: () => number;
  getAllTopics: () => (Topico & { disciplinaNome: string; disciplinaId: string })[];
  findTopicById: (topicId: string) => { disciplina: Disciplina; topico: Topico } | null;
}

export const useDisciplinasStore = create<DisciplinasState>((set, get) => ({
  disciplinas: [],
  loading: false,

  fetchDisciplinas: async (editalId) => {
    set({ loading: true });
    try {
      const disciplinas = await getDisciplinas(editalId);
      set({ disciplinas });
    } catch (error) {
      console.error("Failed to fetch disciplinas:", error);
      toast.error("Não foi possível carregar as disciplinas.");
    } finally {
      set({ loading: false });
    }
  },

  addDisciplina: async (disciplinaData) => {
    const editalAtivoId = useEditalStore.getState().editalAtivo?.id;
    if (!editalAtivoId) throw new Error("Nenhum edital ativo selecionado.");

    try {
      const novaDisciplina = await createDisciplina(editalAtivoId, disciplinaData);
      set(state => ({ disciplinas: [...state.disciplinas, novaDisciplina] }));
      return novaDisciplina;
    } catch (error) {
      console.error("Failed to create disciplina:", error);
      toast.error("Falha ao criar disciplina.");
      throw error;
    }
  },
  
  updateDisciplina: async (id, updates) => {
    try {
      const disciplinaAtualizada = await updateDisciplinaApi(id, updates);
      set(state => ({
        disciplinas: state.disciplinas.map(d => d.id === id ? { ...d, ...disciplinaAtualizada, progresso: calculateProgress(disciplinaAtualizada.topicos || d.topicos) } : d),
      }));
    } catch (error) {
      console.error("Failed to update disciplina:", error);
      toast.error("Falha ao atualizar disciplina.");
      throw error;
    }
  },

  removeDisciplina: async (id) => {
    try {
      await deleteDisciplina(id);
      useCiclosStore.getState().removeSessoesPorDisciplina(id);
      set(state => ({
        disciplinas: state.disciplinas.filter(d => d.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete disciplina:", error);
      toast.error("Falha ao remover disciplina.");
      throw error;
    }
  },

  addTopico: async (disciplinaId, topicoData) => {
      try {
          const disciplina = get().disciplinas.find(d => d.id === disciplinaId);
          if(!disciplina) return;
          const novoTopico = await createTopico(disciplinaId, topicoData);
          const topicosAtualizados = [...disciplina.topicos, novoTopico];
          get().updateDisciplina(disciplinaId, { topicos: topicosAtualizados });
      } catch (error) {
          console.error("Failed to add topic:", error);
          toast.error("Falha ao adicionar tópico.");
      }
  },

  updateTopico: async (disciplinaId, topicoId, updates) => {
    const disciplina = get().disciplinas.find(d => d.id === disciplinaId);
    if (!disciplina) return;

    const topicoOriginal = disciplina.topicos.find(t => t.id === topicoId);

    const topicosAtualizados = disciplina.topicos.map(t => 
        t.id === topicoId ? { ...t, ...updates } : t
    );

    // Otimistic update
    set(state => ({
      disciplinas: state.disciplinas.map(d => d.id === disciplinaId ? { ...d, topicos: topicosAtualizados, progresso: calculateProgress(topicosAtualizados) } : d)
    }));
    
    // Check for gamification event after optimistic update
    if (updates.concluido && !topicoOriginal?.concluido) {
        useGamificationStore.getState().logXpEvent('trilha_topico_concluido', { topicoId });
    }

    try {
        await updateTopicoApi(topicoId, updates);
    } catch (error) {
        console.error("Failed to update topic on backend:", error);
        toast.error("Falha ao sincronizar atualização do tópico.");
        // Revert UI change on failure
        set({ disciplinas: get().disciplinas });
    }
  },

  getAverageProgress: () => {
    const { disciplinas } = get();
    if (disciplinas.length === 0) return 0;
    const totalProgress = disciplinas.reduce((sum, d) => sum + d.progresso, 0);
    return totalProgress / disciplinas.length;
  },

  getAllTopics: () => {
    const { disciplinas } = get();
    return disciplinas.flatMap(d => 
        d.topicos.map(t => ({
            ...t,
            disciplinaNome: d.nome,
            disciplinaId: d.id
        }))
    );
  },

  findTopicById: (topicId) => {
      const { disciplinas } = get();
      for (const disciplina of disciplinas) {
          const topico = disciplina.topicos.find(t => t.id === topicId);
          if (topico) {
              return { disciplina, topico };
          }
      }
      return null;
  },
}));

// Import useEditalStore at the bottom to avoid circular dependency issues
import { useEditalStore } from './useEditalStore';