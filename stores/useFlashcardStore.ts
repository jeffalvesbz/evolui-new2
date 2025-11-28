import { create } from 'zustand';
import { Flashcard, Disciplina } from '../types';
import { getFlashcards, createFlashcards, updateFlashcardApi, deleteFlashcard as deleteFlashcardApi } from '../services/geminiService';
import { toast } from '../components/Sonner';
// FIX: Changed date-fns import for startOfDay to use a named import, resolving module export error.
import { startOfDay } from 'date-fns';

interface FlashcardStore {
  flashcards: Flashcard[];
  loading: boolean;
  undoStack: Array<{ flashcardId: string; previousState: Partial<Flashcard> }>;

  fetchFlashcardsByTopic: (topicoId: string) => Promise<void>;
  fetchFlashcardsForTopics: (topicIds: string[]) => Promise<void>;
  addFlashcard: (newFlashcard: Omit<Flashcard, 'id' | 'interval' | 'easeFactor' | 'dueDate'>, topicoId: string) => Promise<void>;
  addFlashcards: (newFlashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[], topicoId: string) => Promise<void>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  removeFlashcard: (id: string) => Promise<void>;
  deleteAllFlashcards: (topicoId: string) => Promise<void>;
  getFlashcardsByTopic: (topicoId: string) => Flashcard[];
  getFlashcardsByDisciplinaId: (disciplina: Disciplina, allFlashcards: Flashcard[]) => Flashcard[];
  getDueFlashcards: () => Flashcard[];
  removeFlashcardsByTopicIds: (topicIds: string[]) => void;

  // Novas funcionalidades
  undo: () => Promise<void>;
  canUndo: () => boolean;
  filterByTags: (tags: string[]) => Flashcard[];
  searchFlashcards: (query: string) => Flashcard[];
  getAllTags: () => string[];

  // AI Generation
  generating: boolean;
  generateFlashcards: (prompt: string, type: 'topic' | 'text', options?: any) => Promise<Partial<Flashcard>[]>;

  // Generator State Persistence
  generatorState: {
    mode: 'topic' | 'text';
    prompt: string;
    quantity: number;
    difficulty: string;
    generatedCards: Partial<Flashcard>[];
    step: 'input' | 'preview';
    selectedDisciplinaId: string;
    selectedTopicoId: string;
    selectedCardIndices?: number[];
  } | null;
  saveGeneratorState: (state: {
    mode: 'topic' | 'text';
    prompt: string;
    quantity: number;
    difficulty: string;
    generatedCards: Partial<Flashcard>[];
    step: 'input' | 'preview';
    selectedDisciplinaId: string;
    selectedTopicoId: string;
    selectedCardIndices?: number[];
  }) => void;
  clearGeneratorState: () => void;
}


export const useFlashcardsStore = create<FlashcardStore>((set, get) => ({
  flashcards: [],
  loading: false,
  undoStack: [],

  fetchFlashcardsByTopic: async (topicoId: string) => {
    // Validar que topicoId não seja vazio para evitar erro de UUID inválido
    if (!topicoId || topicoId.trim() === '') {
      console.warn('fetchFlashcardsByTopic chamado com topicoId vazio');
      return;
    }
    set({ loading: true });
    try {
      const flashcards = await getFlashcards(topicoId);
      set(state => ({
        flashcards: [...state.flashcards.filter(fc => fc.topico_id !== topicoId), ...flashcards]
      }));
    } catch (error) {
      console.error(`Failed to fetch flashcards for topic ${topicoId}:`, error);
      toast.error("Não foi possível carregar os flashcards.");
    } finally {
      set({ loading: false });
    }
  },

  fetchFlashcardsForTopics: async (topicIds) => {
    const { flashcards } = get();
    const fetchedTopicIds = new Set(flashcards.map(fc => fc.topico_id));
    // Filtrar IDs vazios ou inválidos para evitar erro de UUID inválido
    const idsToFetch = topicIds.filter(id => id && id.trim() !== '' && !fetchedTopicIds.has(id));

    if (idsToFetch.length === 0) {
      return;
    }

    set({ loading: true });
    try {
      const promises = idsToFetch.map(id => getFlashcards(id));
      const newFlashcardsArrays = await Promise.all(promises);
      const newFlashcards = newFlashcardsArrays.flat();

      set(state => {
        const existingIds = new Set(state.flashcards.map(fc => fc.id));
        const uniqueNewFlashcards = newFlashcards.filter(fc => !existingIds.has(fc.id));
        return {
          flashcards: [...state.flashcards, ...uniqueNewFlashcards]
        };
      });
    } catch (error) {
      console.error("Failed to fetch flashcards for topics", error);
      toast.error("Erro ao carregar alguns flashcards.");
    } finally {
      set({ loading: false });
    }
  },

  addFlashcard: async (newFlashcard, topicoId) => {
    // Verificar limite de flashcards
    const { canCreateFlashcard, incrementFlashcardCount } = await import('./useSubscriptionStore').then(m => m.useSubscriptionStore.getState());

    if (!canCreateFlashcard(1)) {
      toast.error("Você atingiu o limite mensal de flashcards do seu plano.");
      return;
    }

    try {
      const createdFlashcards = await createFlashcards(topicoId, { flashcards: [newFlashcard] });
      set(state => ({
        flashcards: [...state.flashcards, ...createdFlashcards],
      }));
      incrementFlashcardCount(1);
    } catch (e) {
      toast.error("Falha ao salvar flashcard.");
      throw e;
    }
  },

  addFlashcards: async (newFlashcards, topicoId) => {
    // Verificar limite de flashcards
    const { canCreateFlashcard, incrementFlashcardCount } = await import('./useSubscriptionStore').then(m => m.useSubscriptionStore.getState());

    if (!canCreateFlashcard(newFlashcards.length)) {
      toast.error(`Você não tem limite suficiente para criar ${newFlashcards.length} flashcards.`);
      return;
    }

    try {
      const createdFlashcards = await createFlashcards(topicoId, { flashcards: newFlashcards });
      set(state => ({
        flashcards: [...state.flashcards, ...createdFlashcards],
      }));
      incrementFlashcardCount(newFlashcards.length);
    } catch (e) {
      toast.error("Falha ao salvar flashcards.");
      throw e;
    }
  },
  updateFlashcard: async (id, updates) => {
    const originalFlashcards = get().flashcards;
    const flashcardToUpdate = originalFlashcards.find(fc => fc.id === id);

    // Salvar no undo stack
    if (flashcardToUpdate) {
      set(state => ({
        undoStack: [...state.undoStack.slice(-9), { flashcardId: id, previousState: { ...flashcardToUpdate } }]
      }));
    }

    // Optimistic update
    set(state => ({
      flashcards: state.flashcards.map(fc =>
        fc.id === id ? { ...fc, ...updates } as Flashcard : fc
      ),
    }));

    // Verificar se é erro de rede
    const isNetworkError = (error: any) => {
      return error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error?.message?.includes('NetworkError') ||
        error?.code === 'NETWORK_ERROR';
    };

    try {
      const updatedFromDb = await updateFlashcardApi(id, updates);
      // Sync with db
      set(state => ({
        flashcards: state.flashcards.map(fc =>
          fc.id === id ? updatedFromDb : fc
        )
      }));
    } catch (e: any) {
      // Se for erro de rede, manter o optimistic update
      if (isNetworkError(e)) {
        console.warn('Network error - keeping optimistic update:', e);
        // Manter o optimistic update para permitir estudo offline
        // Não mostrar toast para não incomodar o usuário
      } else {
        // Para outros erros, reverter e mostrar mensagem
        toast.error("Falha ao atualizar flashcard.");
        set({ flashcards: originalFlashcards }); // Revert on failure
        throw e;
      }
    }
  },
  removeFlashcard: async (id: string) => {
    const originalFlashcards = get().flashcards;
    // Optimistic update
    set(state => ({
      flashcards: state.flashcards.filter(fc => fc.id !== id),
    }));
    try {
      await deleteFlashcardApi(id);
    } catch (e) {
      toast.error("Falha ao remover flashcard.");
      set({ flashcards: originalFlashcards }); // Revert on failure
      throw e;
    }
  },

  deleteAllFlashcards: async (topicoId) => {
    const originalFlashcards = get().flashcards;
    const flashcardsToDelete = originalFlashcards.filter(fc => fc.topico_id === topicoId);

    if (flashcardsToDelete.length === 0) {
      toast.error("Nenhum flashcard para excluir neste deck.");
      return;
    }

    // Optimistic update
    set(state => ({
      flashcards: state.flashcards.filter(fc => fc.topico_id !== topicoId),
    }));

    try {
      const { deleteFlashcardsByTopic } = await import('../services/geminiService');
      await deleteFlashcardsByTopic(topicoId);
      toast.success(`${flashcardsToDelete.length} flashcards excluídos com sucesso!`);
    } catch (e) {
      toast.error("Falha ao excluir flashcards.");
      set({ flashcards: originalFlashcards }); // Revert on failure
      throw e;
    }
  },
  getFlashcardsByTopic: (topicoId) => {
    return get().flashcards.filter(fc => fc.topico_id === topicoId);
  },
  getFlashcardsByDisciplinaId: (disciplina, allFlashcards) => {
    if (!disciplina) return [];
    const topicIds = new Set(disciplina.topicos.map(t => t.id));
    return allFlashcards.filter(fc => topicIds.has(fc.topico_id));
  },
  getDueFlashcards: () => {
    const today = startOfDay(new Date());
    // Filtrar flashcards que:
    // 1. Têm data de revisão vencida (dueDate <= hoje)
    // 2. Foram estudados pelo menos uma vez (verificado via flashcard_reviews no componente)
    // 
    // NOTA: O filtro de "estudado pelo menos uma vez" é feito no componente FlashcardsPage
    // porque requer uma consulta ao banco de dados (flashcard_reviews)
    // Aqui apenas filtramos por dueDate
    return get().flashcards.filter(fc => {
      try {
        return new Date(fc.dueDate) <= today;
      } catch (e) {
        return false;
      }
    });
  },
  removeFlashcardsByTopicIds: (topicIds) => {
    const topicIdSet = new Set(topicIds);
    set(state => ({
      flashcards: state.flashcards.filter(fc => !topicIdSet.has(fc.topico_id))
    }));
  },

  // Novas funcionalidades
  undo: async () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];
    const { flashcardId, previousState } = lastAction;

    try {
      await get().updateFlashcard(flashcardId, previousState);
      // Remover do undo stack (sem adicionar novamente)
      set(state => ({
        undoStack: state.undoStack.slice(0, -2) // Remove os 2 últimos (o undo e o update)
      }));
      toast.success("Ação desfeita!");
    } catch (e) {
      toast.error("Não foi possível desfazer a ação.");
    }
  },

  canUndo: () => {
    return get().undoStack.length > 0;
  },

  filterByTags: (tags: string[]) => {
    if (tags.length === 0) return get().flashcards;

    return get().flashcards.filter(fc => {
      if (!fc.tags || fc.tags.length === 0) return false;
      return tags.some(tag => fc.tags?.includes(tag));
    });
  },

  searchFlashcards: (query: string) => {
    if (!query.trim()) return get().flashcards;

    const lowerQuery = query.toLowerCase();
    return get().flashcards.filter(fc =>
      fc.pergunta.toLowerCase().includes(lowerQuery) ||
      fc.resposta.toLowerCase().includes(lowerQuery) ||
      fc.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },

  getAllTags: () => {
    const allTags = new Set<string>();
    get().flashcards.forEach(fc => {
      fc.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  },

  generating: false,

  generateFlashcards: async (prompt: string, type: 'topic' | 'text', options?: any) => {
    set({ generating: true });
    try {
      const { gerarFlashcardsIA, gerarFlashcardsPorTexto } = await import('../services/geminiService');
      let generatedCards: Partial<Flashcard>[] = [];

      if (type === 'topic') {
        generatedCards = await gerarFlashcardsIA(prompt, options?.quantidade || 5, options?.dificuldade || 'médio');
      } else {
        generatedCards = await gerarFlashcardsPorTexto(prompt, options?.quantidade || 5);
      }

      return generatedCards;
    } catch (error: any) {
      console.error("Erro ao gerar flashcards:", error);
      // Mostra a mensagem de erro específica se disponível, senão usa uma genérica
      const errorMessage = error?.message || "Falha ao gerar flashcards com IA.";
      toast.error(errorMessage);
      throw error; // Re-lança o erro para que o componente possa tratá-lo se necessário
    } finally {
      set({ generating: false });
    }
  },

  // Generator State Persistence
  generatorState: (() => {
    try {
      const saved = localStorage.getItem('flashcard-generator-state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar estado do gerador:', e);
    }
    return null;
  })(),

  saveGeneratorState: (state) => {
    try {
      localStorage.setItem('flashcard-generator-state', JSON.stringify(state));
      set({ generatorState: state });
    } catch (e) {
      console.error('Erro ao salvar estado do gerador:', e);
    }
  },

  clearGeneratorState: () => {
    try {
      localStorage.removeItem('flashcard-generator-state');
      set({ generatorState: null });
    } catch (e) {
      console.error('Erro ao limpar estado do gerador:', e);
    }
  },
})
);