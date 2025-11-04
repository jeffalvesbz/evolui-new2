import { create } from 'zustand';
import { Disciplina, Topico } from '../types';
import { getDisciplinas, createDisciplina, updateDisciplinaApi, deleteDisciplina, updateTopicoApi, createTopico, deleteTopico } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useCiclosStore } from './useCiclosStore';
import { useGamificationStore } from './useGamificationStore';
import { checkAndAwardBadges } from '../services/badgeService';
import { useEditalStore } from './useEditalStore';
import { useFlashcardsStore } from './useFlashcardStore';

const calculateProgress = (topicos: Topico[]): number => {
  if (topicos.length === 0) return 0;
  const concluidos = topicos.filter((t) => t.concluido).length;
  return Math.round((concluidos / topicos.length) * 100);
};

interface DisciplinasState {
  disciplinas: Disciplina[];
  loading: boolean;
  
  fetchDisciplinas: (studyPlanId: string) => Promise<void>;
  addDisciplina: (disciplinaData: Omit<Disciplina, 'id' | 'progresso' | 'studyPlanId'>) => Promise<Disciplina>;
  updateDisciplina: (id: string, updates: Partial<Omit<Disciplina, 'id'>>) => Promise<void>;
  removeDisciplina: (id: string) => Promise<void>;
  
  updateTopico: (disciplinaId: string, topicoId: string, updates: Partial<Topico>) => Promise<void>;
  addTopico: (disciplinaId: string, topicoData: Omit<Topico, 'id'>) => Promise<Topico>;
  removeTopico: (disciplinaId: string, topicoId: string) => Promise<void>;

  findTopicById: (topicoId: string) => { disciplina: Disciplina; topico: Topico } | null;
  getAverageProgress: () => number;
}

export const useDisciplinasStore = create<DisciplinasState>((set, get) => ({
  disciplinas: [],
  loading: false,

  fetchDisciplinas: async (studyPlanId: string) => {
    set({ loading: true });
    try {
      const disciplinas = await getDisciplinas(studyPlanId);
      set({ disciplinas, loading: false });
    } catch (error) {
      console.error("Failed to fetch disciplinas:", error);
      toast.error("Não foi possível carregar as disciplinas.");
      set({ loading: false });
    }
  },

  addDisciplina: async (disciplinaData) => {
    const studyPlanId = useEditalStore.getState().editalAtivo?.id;
    if (!studyPlanId) throw new Error("Plano de estudo ativo não encontrado.");

    try {
      const novaDisciplina = await createDisciplina(studyPlanId, disciplinaData);
      set(state => ({ disciplinas: [...state.disciplinas, novaDisciplina] }));
      return novaDisciplina;
    } catch (error) {
      console.error("Failed to add disciplina:", error);
      toast.error("Falha ao adicionar disciplina.");
      throw error;
    }
  },

  updateDisciplina: async (id, updates) => {
    try {
      const disciplinaDB = await updateDisciplinaApi(id, updates);
      set(state => ({
        disciplinas: state.disciplinas.map(d => 
          d.id === id ? { ...d, ...updates, ...(disciplinaDB || {}) } : d
        )
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
      
      const disciplinaRemovida = get().disciplinas.find(d => d.id === id);
      const topicosRemovidosIds = disciplinaRemovida?.topicos.map(t => t.id) || [];
      useFlashcardsStore.getState().removeFlashcardsByTopicIds(topicosRemovidosIds);
      useCiclosStore.getState().removeSessoesPorDisciplina(id);
      
      set(state => ({
        disciplinas: state.disciplinas.filter(d => d.id !== id),
      }));
    } catch (error) {
      console.error("Failed to remove disciplina:", error);
      toast.error("Falha ao remover disciplina.");
      throw error;
    }
  },
  
  updateTopico: async (disciplinaId, topicoId, updates) => {
    const disciplina = get().disciplinas.find(d => d.id === disciplinaId);
    if (!disciplina) return;
    
    try {
        await updateTopicoApi(topicoId, updates);
        const topicosAtualizados = disciplina.topicos.map(t => 
            t.id === topicoId ? { ...t, ...updates } : t
        );
        const progresso = calculateProgress(topicosAtualizados);

        // Optimistic update on UI
        set(state => ({
            disciplinas: state.disciplinas.map(d =>
                d.id === disciplinaId ? { ...d, topicos: topicosAtualizados, progresso } : d
            )
        }));

        // check for badge on completion
        if (updates.concluido) {
            checkAndAwardBadges();
        }

    } catch (error) {
        console.error("Failed to update topico:", error);
        toast.error("Falha ao atualizar o tópico.");
        throw error;
    }
  },

  addTopico: async (disciplinaId, topicoData) => {
    const disciplina = get().disciplinas.find(d => d.id === disciplinaId);
    if (!disciplina) throw new Error("Disciplina não encontrada");

    try {
      const novoTopico = await createTopico(disciplinaId, topicoData);
      const topicosAtualizados = [...disciplina.topicos, novoTopico];
      const progresso = calculateProgress(topicosAtualizados);
      
      set(state => ({
        disciplinas: state.disciplinas.map(d => 
          d.id === disciplinaId ? { ...d, topicos: topicosAtualizados, progresso } : d
        )
      }));
      return novoTopico;
    } catch (error) {
      console.error("Failed to add topico:", error);
      toast.error("Falha ao adicionar tópico.");
      throw error;
    }
  },

  removeTopico: async (disciplinaId, topicoId) => {
    const disciplina = get().disciplinas.find(d => d.id === disciplinaId);
    if (!disciplina) return;

    try {
        await deleteTopico(topicoId);
        
        const topicosAtualizados = disciplina.topicos.filter(t => t.id !== topicoId);
        const progresso = calculateProgress(topicosAtualizados);
        
        set(state => ({
            disciplinas: state.disciplinas.map(d =>
                d.id === disciplinaId ? { ...d, topicos: topicosAtualizados, progresso } : d
            )
        }));
    } catch (error) {
        console.error("Failed to remove topico:", error);
        toast.error("Falha ao remover o tópico.");
        throw error;
    }
  },

  findTopicById: (topicoId) => {
    for (const disciplina of get().disciplinas) {
      const topico = disciplina.topicos.find(t => t.id === topicoId);
      if (topico) {
        return { disciplina, topico };
      }
    }
    return null;
  },

  getAverageProgress: () => {
    const { disciplinas } = get();
    if (disciplinas.length === 0) return 0;
    const totalProgress = disciplinas.reduce((acc, d) => acc + d.progresso, 0);
    return totalProgress / disciplinas.length;
  },
}));