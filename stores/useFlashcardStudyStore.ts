import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Flashcard } from '../types';

export type StudySession = {
  deck: Flashcard[];
  name: string;
  isReviewSession: boolean;
};

type DeckProgress = {
  currentIndex: number;
  deck: Flashcard[];
  answers: Record<number, 'errei' | 'dificil' | 'bom' | 'facil'>;
};

// Função para gerar um ID único para o deck baseado nos flashcards e tipo de sessão
function getDeckId(session: StudySession): string {
  const cardIds = session.deck.map(c => c.id).sort().join(',');
  return `${session.name}-${session.isReviewSession ? 'review' : 'study'}-${cardIds}`;
}

interface FlashcardStudyState {
  session: StudySession | null;
  currentIndex: number;
  isFlipped: boolean;
  answers: Record<number, 'errei' | 'dificil' | 'bom' | 'facil'>;
  sessionStartTime: number | null;
  deckProgress: Record<string, DeckProgress>; // Progresso salvo por deck
  currentDeckId: string | null; // ID do deck atual (preservado mesmo quando cards são removidos)
  
  startSession: (session: StudySession) => void;
  flipCard: () => void;
  answerCard: (difficulty: 'errei' | 'dificil' | 'bom' | 'facil') => void;
  exitSession: () => void;
  removeCurrentCardFromSession: () => void;
  saveDeckProgress: () => void;
  clearDeckProgress: (deckId: string) => void;
}

export const useFlashcardStudyStore = create<FlashcardStudyState>()(
  persist(
    (set, get) => ({
      session: null,
      currentIndex: 0,
      isFlipped: false,
      answers: {},
      sessionStartTime: null,
      deckProgress: {},
      currentDeckId: null,
      
      startSession: (session) => {
        const deckId = getDeckId(session);
        const savedProgress = get().deckProgress[deckId];
        
        let deck: Flashcard[];
        let startIndex: number;
        let savedAnswers: Record<number, 'errei' | 'dificil' | 'bom' | 'facil'>;
        
        if (savedProgress && savedProgress.currentIndex < savedProgress.deck.length) {
          // Restaura o progresso salvo
          deck = savedProgress.deck;
          startIndex = savedProgress.currentIndex;
          savedAnswers = savedProgress.answers;
        } else {
          // Embaralha o deck antes de iniciar, exceto para sessões de revisão que já podem ter uma ordem
          deck = session.isReviewSession ? session.deck : [...session.deck].sort(() => Math.random() - 0.5);
          startIndex = 0;
          savedAnswers = {};
        }
        
        set({ 
          session: { ...session, deck }, 
          currentIndex: startIndex, 
          isFlipped: false, 
          answers: savedAnswers,
          sessionStartTime: Date.now(),
          currentDeckId: deckId, // Armazena o ID original do deck
        });
      },
      
      flipCard: () => {
        set(state => ({ isFlipped: !state.isFlipped }));
      },
      
      answerCard: (difficulty) => {
        set(state => {
          const newIndex = state.currentIndex + 1;
          const newAnswers = { ...state.answers, [state.currentIndex]: difficulty };
          
          // Salva o progresso automaticamente após cada resposta
          if (state.session && state.currentDeckId) {
            const deckId = state.currentDeckId;
            const newProgress: DeckProgress = {
              currentIndex: newIndex,
              deck: state.session.deck,
              answers: newAnswers,
            };
            
            // Se completou o deck, remove o progresso salvo
            if (newIndex >= state.session.deck.length) {
              const { [deckId]: _, ...restProgress } = state.deckProgress;
              return {
                answers: newAnswers,
                currentIndex: newIndex,
                isFlipped: false,
                deckProgress: restProgress,
              };
            }
            
            return {
              answers: newAnswers,
              currentIndex: newIndex,
              isFlipped: false,
              deckProgress: {
                ...state.deckProgress,
                [deckId]: newProgress,
              },
            };
          }
          
          return {
            answers: newAnswers,
            currentIndex: newIndex,
            isFlipped: false,
          };
        });
      },
      
      exitSession: () => {
        const state = get();
        // Salva o progresso antes de sair
        if (state.session && state.currentDeckId) {
          const deckId = state.currentDeckId;
          // Se ainda há cards para estudar, salva o progresso
          if (state.currentIndex < state.session.deck.length) {
            const progress: DeckProgress = {
              currentIndex: state.currentIndex,
              deck: state.session.deck,
              answers: state.answers,
            };
            set({
              deckProgress: {
                ...state.deckProgress,
                [deckId]: progress,
              },
            });
          }
        }
        
        set({ session: null, currentIndex: 0, isFlipped: false, answers: {}, sessionStartTime: null, currentDeckId: null });
      },
      
      saveDeckProgress: () => {
        const state = get();
        if (state.session && state.currentDeckId) {
          const deckId = state.currentDeckId;
          if (state.currentIndex < state.session.deck.length) {
            const progress: DeckProgress = {
              currentIndex: state.currentIndex,
              deck: state.session.deck,
              answers: state.answers,
            };
            set({
              deckProgress: {
                ...state.deckProgress,
                [deckId]: progress,
              },
            });
          }
        }
      },

      removeCurrentCardFromSession: () => {
        set(state => {
          if (!state.session || !state.currentDeckId) return {};
          const newDeck = state.session.deck.filter((_, index) => index !== state.currentIndex);
          
          // Atualiza o progresso salvo após remover o card
          // Usa o deckId original para manter o progresso consistente
          const deckId = state.currentDeckId;
          const newIndex = state.currentIndex < newDeck.length ? state.currentIndex : Math.max(0, newDeck.length - 1);
          const progress: DeckProgress = {
            currentIndex: newIndex,
            deck: newDeck,
            answers: state.answers,
          };
          
          return {
            session: {
              ...state.session,
              deck: newDeck,
            },
            currentIndex: newIndex,
            isFlipped: false,
            deckProgress: {
              ...state.deckProgress,
              [deckId]: progress,
            },
          };
        });
      },
      
      clearDeckProgress: (deckId: string) => {
        set(state => {
          const { [deckId]: _, ...restProgress } = state.deckProgress;
          return { deckProgress: restProgress };
        });
      },
    }),
    {
      name: 'flashcard-study-session',
      storage: createJSONStorage(() => localStorage),
    }
  )
);