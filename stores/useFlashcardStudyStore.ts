import { create } from 'zustand';
<<<<<<< HEAD
import { Flashcard } from '../types';
import { getStudySession, saveStudySession, deleteStudySession } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
=======
import { persist, createJSONStorage } from 'zustand/middleware';
import { Flashcard } from '../types';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

export type StudySession = {
  deck: Flashcard[];
  name: string;
  isReviewSession: boolean;
<<<<<<< HEAD
  totalCards: number; // Total original de cards para contador progressivo
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
};

type DeckProgress = {
  currentIndex: number;
  deck: Flashcard[];
  answers: Record<number, 'errei' | 'dificil' | 'bom' | 'facil'>;
};

<<<<<<< HEAD
// Função para gerar um ID único para o deck baseado no nome e tipo de sessão
// Usa apenas o nome da disciplina/sessão, não os IDs dos cards, para manter consistência
function getDeckId(session: StudySession): string {
  // Normalizar o nome (remover espaços, caracteres especiais)
  const normalizedName = session.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `${normalizedName}-${session.isReviewSession ? 'review' : 'study'}`;
=======
// Função para gerar um ID único para o deck baseado nos flashcards e tipo de sessão
function getDeckId(session: StudySession): string {
  const cardIds = session.deck.map(c => c.id).sort().join(',');
  return `${session.name}-${session.isReviewSession ? 'review' : 'study'}-${cardIds}`;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
}

interface FlashcardStudyState {
  session: StudySession | null;
  currentIndex: number;
  isFlipped: boolean;
<<<<<<< HEAD
  answers: Record<string, 'errei' | 'dificil' | 'bom' | 'facil'>; // Agora indexado por card ID
  sessionStartTime: number | null;
  currentDeckId: string | null;
  syncing: boolean; // Indica se está sincronizando com Supabase

  startSession: (session: StudySession) => Promise<void>;
  flipCard: () => void;
  answerCard: (difficulty: 'errei' | 'dificil' | 'bom' | 'facil') => Promise<void>;
  exitSession: () => Promise<void>;
  removeCurrentCardFromSession: () => Promise<void>;
  clearDeckProgress: (deckId: string) => Promise<void>;
  saveProgress: () => Promise<void>;
}

export const useFlashcardStudyStore = create<FlashcardStudyState>((set, get) => ({
  session: null,
  currentIndex: 0,
  isFlipped: false,
  answers: {},
  sessionStartTime: null,
  currentDeckId: null,
  syncing: false,

  startSession: async (session) => {
    const deckId = getDeckId(session);
    console.log('[FlashcardStudy] Starting session:', { deckId, name: session.name, cardCount: session.deck.length });
    set({ syncing: true });

    try {
      // Tentar carregar progresso do Supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Tentar buscar sessão com o novo formato de deckId
        let savedSession: any = await getStudySession(user.id, deckId);

        // Se não encontrou, tentar buscar por nome (compatibilidade com formato antigo)
        if (!savedSession) {
          try {
            const { data: sessions } = await supabase
              .from('flashcard_study_sessions')
              .select('*')
              .eq('user_id', user.id)
              .like('deck_id', `${session.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${session.isReviewSession ? 'review' : 'study'}%`)
              .order('last_updated', { ascending: false })
              .limit(1);

            if (sessions && sessions.length > 0) {
              savedSession = sessions[0];
              console.log('[FlashcardStudy] Found session with old format, migrating...');
              // Atualizar o deckId para o novo formato
              if (savedSession && savedSession.deck_id !== deckId) {
                try {
                  const updateQuery = supabase
                    .from('flashcard_study_sessions')
                    .update({ deck_id: deckId } as never)
                    .eq('id', savedSession.id);
                  await updateQuery;
                } catch (e) {
                  console.warn('Error updating deck_id:', e);
                }
              }
            }
          } catch (e) {
            console.warn('Error searching for old session format:', e);
          }
        }

        if (savedSession) {
          console.log('[FlashcardStudy] Restoring session:', {
            savedDeckLength: savedSession.deck_data?.length || 0,
            currentIndex: savedSession.current_index,
            answersCount: Object.keys(savedSession.answers || {}).length
          });
          // Restaurar progresso do Supabase
          // Criar um mapa de IDs para flashcards para busca rápida
          const cardMap = new Map(session.deck.map(card => [card.id, card]));

          // Processar respostas salvas - agora indexadas por card ID
          const adjustedAnswers: Record<string, 'errei' | 'dificil' | 'bom' | 'facil'> = {};

          // Converter respostas do formato salvo (pode ser índice ou ID)
          Object.entries(savedSession.answers || {}).forEach(([key, value]) => {
            const index = parseInt(key);
            const answerValue = value as 'errei' | 'dificil' | 'bom' | 'facil';
            // Se a chave é numérica, pode ser formato antigo (índice)
            if (!isNaN(index) && savedSession.deck_data && index < savedSession.deck_data.length) {
              // Converter índice para ID do card
              const cardId = savedSession.deck_data[index];
              if (cardId) {
                adjustedAnswers[cardId] = answerValue;
              }
            } else {
              // Se já está no formato novo (ID), manter
              adjustedAnswers[key] = answerValue;
            }
          });

          // Filtrar cards já respondidos do deck atual
          // Usar o deck atual (session.deck) e remover os que já foram respondidos
          const remainingDeck = session.deck.filter(card => !adjustedAnswers[card.id]);

          // Se não há mais cards para estudar, a sessão foi completada
          if (remainingDeck.length === 0) {
            // Deletar sessão completada
            try {
              await deleteStudySession(user.id, deckId);
            } catch (e) {
              console.warn('Error deleting completed session:', e);
            }
            // Iniciar nova sessão com todos os cards (resetar)
            const deck = session.isReviewSession
              ? session.deck
              : [...session.deck].sort(() => Math.random() - 0.5);

            set({
              session: { ...session, deck, totalCards: deck.length },
              currentIndex: 0,
              isFlipped: false,
              answers: {},
              sessionStartTime: Date.now(),
              currentDeckId: deckId,
              syncing: false,
            });

            // Salvar nova sessão
            try {
              await saveStudySession({
                user_id: user.id,
                deck_id: deckId,
                current_index: 0,
                deck_data: deck.map(c => c.id),
                answers: {},
                session_start_time: new Date().toISOString(),
              });
            } catch (saveError) {
              console.error('Error saving new session:', saveError);
            }
            return;
          }

          // Reconstruir deck na ordem salva se possível, senão usar ordem atual
          let finalDeck = remainingDeck;
          let hasSavedOrder = false;

          if (savedSession.deck_data && savedSession.deck_data.length > 0) {
            // Tentar manter a ordem salva para os cards que ainda não foram respondidos
            const savedOrder = savedSession.deck_data
              .map(id => cardMap.get(id))
              .filter((card): card is Flashcard =>
                card !== undefined && !adjustedAnswers[card.id]
              );

            // Se conseguimos reconstruir a ordem, usar ela e NÃO embaralhar
            if (savedOrder.length > 0) {
              finalDeck = savedOrder;
              hasSavedOrder = true;
            }
          }

          // Só embaralhar se não há ordem salva e não é sessão de revisão
          if (!hasSavedOrder && !session.isReviewSession && finalDeck.length > 1) {
            finalDeck = [...finalDeck].sort(() => Math.random() - 0.5);
          }

          // Ajustar índice para não ultrapassar o tamanho do deck restante
          // Se temos ordem salva, usar o índice salvo diretamente
          const adjustedIndex = hasSavedOrder
            ? Math.min(savedSession.current_index || 0, finalDeck.length - 1)
            : Math.min(savedSession.current_index || 0, finalDeck.length - 1);
          const finalIndex = Math.max(0, adjustedIndex);

          console.log('[FlashcardStudy] Session restored:', {
            remainingCards: finalDeck.length,
            currentIndex: finalIndex,
            answeredCards: Object.keys(adjustedAnswers).length
          });

          // Calcular total original de cards
          // FIX: Usar o tamanho do deck final (restante) + respondidos para garantir consistência
          // Isso evita contagens negativas se cards foram excluídos do deck original
          const totalCards = finalDeck.length + Object.keys(adjustedAnswers).length;

          set({
            session: { ...session, deck: finalDeck, totalCards },
            currentIndex: finalIndex,
            isFlipped: false,
            answers: adjustedAnswers,
            sessionStartTime: new Date(savedSession.session_start_time).getTime(),
            currentDeckId: deckId,
            syncing: false,
          });
          return;
        }
      }

      // Se não há progresso salvo, iniciar nova sessão
      console.log('[FlashcardStudy] No saved session found, starting new session');
      // Embaralhar se não for sessão de revisão
      const deck = session.isReviewSession
        ? session.deck
        : [...session.deck].sort(() => Math.random() - 0.5);

      set({
        session: { ...session, deck, totalCards: deck.length },
        currentIndex: 0,
        isFlipped: false,
        answers: {},
        sessionStartTime: Date.now(),
        currentDeckId: deckId,
        syncing: false,
      });

      // Salvar nova sessão no Supabase
      if (user) {
        try {
          await saveStudySession({
            user_id: user.id,
            deck_id: deckId,
            current_index: 0,
            deck_data: deck.map(c => c.id),
            answers: {},
            session_start_time: new Date().toISOString(),
          });
        } catch (saveError) {
          console.error('Error saving new session:', saveError);
          // Continuar mesmo se não conseguir salvar
        }
      }
    } catch (error) {
      console.error('Error loading session from Supabase:', error);
      // Fallback: iniciar sessão localmente
      const deck = session.isReviewSession
        ? session.deck
        : [...session.deck].sort(() => Math.random() - 0.5);

      set({
        session: { ...session, deck, totalCards: deck.length },
        currentIndex: 0,
        isFlipped: false,
        answers: {},
        sessionStartTime: Date.now(),
        currentDeckId: deckId,
        syncing: false,
      });
    }
  },

  flipCard: () => {
    set(state => ({ isFlipped: !state.isFlipped }));
  },

  answerCard: async (difficulty) => {
    const state = get();
    if (!state.session || !state.currentDeckId) return;

    // Remover o flashcard atual do deck (não excluir do banco, apenas da sessão)
    const currentCardId = state.session.deck[state.currentIndex]?.id;
    const newDeck = state.session.deck.filter((_, index) => index !== state.currentIndex);

    // Manter o mesmo índice (já que removemos o card atual, o próximo card ocupa a mesma posição)
    // Se era o último card, ajustar para não ultrapassar
    const newIndex = state.currentIndex < newDeck.length ? state.currentIndex : Math.max(0, newDeck.length - 1);

    // Salvar a resposta do card removido (usando o ID do card como chave)
    const newAnswers = { ...state.answers };
    if (currentCardId) {
      newAnswers[currentCardId] = difficulty;
    }

    console.log('[FlashcardStudy] Answering card:', {
      cardId: currentCardId,
      difficulty,
      remainingCards: newDeck.length,
      newIndex,
      totalAnswered: Object.keys(newAnswers).length
    });

    // Atualizar estado local imediatamente
    set({
      session: {
        ...state.session,
        deck: newDeck,
      },
      answers: newAnswers,
      currentIndex: newIndex,
      isFlipped: false,
    });

    // Verificar se é erro de rede
    const isNetworkError = (error: any) => {
      return error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
        error?.message?.includes('NetworkError') ||
        error?.code === 'NETWORK_ERROR';
    };

    // Sincronizar com Supabase em background com retry
    const syncWithRetry = async (retries = 2) => {
      const currentState = get(); // Pegar estado atualizado
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user && currentState.session) {
          // Se completou o deck (não há mais cards), deletar sessão
          if (currentState.session.deck.length === 0) {
            await deleteStudySession(user.id, currentState.currentDeckId!);
          } else {
            // Atualizar progresso com o deck atualizado (sem os cards respondidos)
            await saveStudySession({
              user_id: user.id,
              deck_id: currentState.currentDeckId!,
              current_index: currentState.currentIndex,
              deck_data: currentState.session.deck.map(c => c.id),
              answers: currentState.answers,
              session_start_time: new Date(currentState.sessionStartTime || Date.now()).toISOString(),
            });
          }
        }
      } catch (error: any) {
        // Se for erro de rede e ainda houver tentativas, tentar novamente
        if (isNetworkError(error) && retries > 0) {
          console.warn('Network error - retrying sync:', error);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
          return syncWithRetry(retries - 1);
        }
        // Para erros de rede sem tentativas ou outros erros, apenas logar
        if (isNetworkError(error)) {
          console.warn('Network error - progress saved locally, will sync when online');
        } else {
          console.error('Error syncing session to Supabase:', error);
        }
        // Continuar mesmo se a sincronização falhar - progresso está salvo localmente
      }
    };

    // Executar sincronização em background (não bloquear)
    syncWithRetry().catch(err => {
      if (!isNetworkError(err)) {
        console.error('Error in sync retry:', err);
      }
    });
  },

  exitSession: async () => {
    const state = get();

    // Salvar progresso antes de sair (se não completou)
    if (state.session && state.currentDeckId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          await saveStudySession({
            user_id: user.id,
            deck_id: state.currentDeckId,
            current_index: state.currentIndex,
            deck_data: state.session.deck.map(c => c.id),
            answers: state.answers,
            session_start_time: new Date(state.sessionStartTime || Date.now()).toISOString(),
          });
        }
      } catch (error) {
        console.error('Error saving session on exit:', error);
      }
    }

    set({
=======
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
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      session: null,
      currentIndex: 0,
      isFlipped: false,
      answers: {},
      sessionStartTime: null,
<<<<<<< HEAD
      currentDeckId: null
    });
  },

  removeCurrentCardFromSession: async () => {
    const state = get();
    if (!state.session || !state.currentDeckId) return;

    const newDeck = state.session.deck.filter((_, index) => index !== state.currentIndex);
    const newIndex = state.currentIndex < newDeck.length ? state.currentIndex : Math.max(0, newDeck.length - 1);

    set({
      session: {
        ...state.session,
        deck: newDeck,
      },
      currentIndex: newIndex,
      isFlipped: false,
    });

    // Sincronizar com Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await saveStudySession({
          user_id: user.id,
          deck_id: state.currentDeckId,
          current_index: newIndex,
          deck_data: newDeck.map(c => c.id),
          answers: state.answers,
          session_start_time: new Date(state.sessionStartTime || Date.now()).toISOString(),
        });
      }
    } catch (error) {
      console.error('Error syncing after card removal:', error);
    }
  },

  clearDeckProgress: async (deckId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        await deleteStudySession(user.id, deckId);
      }
    } catch (error) {
      console.error('Error clearing deck progress:', error);
    }
  },

  saveProgress: async () => {
    const state = get();
    if (!state.session || !state.currentDeckId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && state.session.deck.length > 0) {
        await saveStudySession({
          user_id: user.id,
          deck_id: state.currentDeckId,
          current_index: state.currentIndex,
          deck_data: state.session.deck.map(c => c.id),
          answers: state.answers,
          session_start_time: new Date(state.sessionStartTime || Date.now()).toISOString(),
        });
      }
    } catch (error) {
      // Falha silenciosa - não bloquear o usuário
      console.warn('Error auto-saving progress:', error);
    }
  },
}));
=======
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
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
