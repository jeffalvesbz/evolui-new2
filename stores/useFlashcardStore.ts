import { create } from 'zustand';
import { Flashcard, Disciplina } from '../types';
import { getFlashcards, createFlashcards, updateFlashcardApi, deleteFlashcard as deleteFlashcardApi } from '../services/geminiService';
import { toast } from '../components/Sonner';
// FIX: Changed date-fns import for startOfDay to use a named import, resolving module export error.
import { startOfDay } from 'date-fns';

interface FlashcardStore {
  flashcards: Flashcard[];
  loading: boolean;
  fetchFlashcardsByTopic: (topicoId: string) => Promise<void>;
  fetchFlashcardsForTopics: (topicIds: string[]) => Promise<void>;
  addFlashcard: (newFlashcard: Omit<Flashcard, 'id' | 'interval' | 'easeFactor' | 'dueDate'>, topicoId: string) => Promise<void>;
  addFlashcards: (newFlashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[], topicoId: string) => Promise<void>;
  updateFlashcard: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  removeFlashcard: (id: string) => Promise<void>;
  getFlashcardsByTopic: (topicoId: string) => Flashcard[];
  getFlashcardsByDisciplinaId: (disciplina: Disciplina, allFlashcards: Flashcard[]) => Flashcard[];
  getDueFlashcards: () => Flashcard[];
  removeFlashcardsByTopicIds: (topicIds: string[]) => void;
}

export const useFlashcardsStore = create<FlashcardStore>((set, get) => ({
      flashcards: [],
      loading: false,

      fetchFlashcardsByTopic: async (topicoId: string) => {
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
          const idsToFetch = topicIds.filter(id => !fetchedTopicIds.has(id));

          if (idsToFetch.length === 0) {
            return;
          }
          
          set({ loading: true });
          try {
            const promises = idsToFetch.map(id => getFlashcards(id));
            const newFlashcardsArrays = await Promise.all(promises);
            const newFlashcards = newFlashcardsArrays.flat();
            set(state => ({
              flashcards: [...state.flashcards, ...newFlashcards]
            }));
          } catch (error) {
            console.error("Failed to fetch flashcards for topics", error);
            toast.error("Erro ao carregar alguns flashcards.");
          } finally {
            set({ loading: false });
          }
      },
      
      addFlashcard: async (newFlashcard, topicoId) => {
        try {
            const createdFlashcards = await createFlashcards(topicoId, { flashcards: [newFlashcard] });
            set(state => ({
                flashcards: [...state.flashcards, ...createdFlashcards],
            }));
        } catch(e) {
            toast.error("Falha ao salvar flashcard.");
            throw e;
        }
      },

      addFlashcards: async (newFlashcards, topicoId) => {
        try {
          const createdFlashcards = await createFlashcards(topicoId, { flashcards: newFlashcards });
          set(state => ({
            flashcards: [...state.flashcards, ...createdFlashcards],
          }));
        } catch(e) {
            toast.error("Falha ao salvar flashcards.");
            throw e;
        }
      },
      updateFlashcard: async (id, updates) => {
        const originalFlashcards = get().flashcards;
        // Optimistic update
        set(state => ({
          flashcards: state.flashcards.map(fc =>
            fc.id === id ? { ...fc, ...updates } as Flashcard : fc
          ),
        }));
        try {
            const updatedFromDb = await updateFlashcardApi(id, updates);
            // Sync with db
            set(state => ({
                flashcards: state.flashcards.map(fc =>
                    fc.id === id ? updatedFromDb : fc
                )
            }));
        } catch(e) {
            toast.error("Falha ao atualizar flashcard.");
            set({ flashcards: originalFlashcards }); // Revert on failure
            throw e;
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
        } catch(e) {
            toast.error("Falha ao remover flashcard.");
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
    })
);