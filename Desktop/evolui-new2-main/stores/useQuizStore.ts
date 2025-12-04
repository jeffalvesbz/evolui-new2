import { create } from 'zustand';
import { Flashcard, QuizQuestion, QuizSession, QuizResult, Quiz } from '../types';
import { gerarAlternativasQuiz, gerarQuestaoCertoErrado, gerarQuizPorDisciplina } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';
import { useSubscriptionStore } from './useSubscriptionStore';
import { recordQuizGeneration } from '../services/quizStatsService';

const QUIZ_SESSION_KEY = 'quiz-session-state';

interface GeracaoEmAndamento {
  id: string;
  quizMode: 'standard' | 'true_false';
  disciplineName?: string;
  questionCount: number;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  dataInicio: string;
}

interface QuizStore {
  session: QuizSession | null;
  isGenerating: boolean;
  generationProgress: number;
  geracaoEmAndamento: GeracaoEmAndamento | null;

  startQuiz: (
    timerEnabled: boolean,
    quizMode: 'standard' | 'true_false',
    disciplineName: string,
    questionCount: number,
    topicos?: Array<{ id: string; titulo: string }>,
    difficulty?: 'Fácil' | 'Médio' | 'Difícil'
  ) => Promise<void>;
  loadSavedQuiz: (quiz: Quiz, timerEnabled?: boolean) => void;
  resetQuiz: () => void;
  answerQuestion: (answer: string) => void;
  nextQuestion: () => void;
  getCurrentQuestion: () => QuizQuestion | null;
  isQuizComplete: () => boolean;
  endQuiz: () => QuizResult | null;
  completeQuiz: () => void;
  clearPersistedSession: () => void;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  session: (() => {
    try {
      const saved = localStorage.getItem(QUIZ_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao carregar sessão de quiz salva:', e);
    }
    return null;
  })(),
  isGenerating: false,
  generationProgress: 0,
  geracaoEmAndamento: null,

  startQuiz: async (
    timerEnabled: boolean,
    quizMode: 'standard' | 'true_false' = 'standard',
    disciplineName: string,
    questionCount: number = 5,
    topicos?: Array<{ id: string; titulo: string }>,
    difficulty: 'Fácil' | 'Médio' | 'Difícil' = 'Médio'
  ) => {
    // Verificar se já há uma geração em andamento
    if (get().geracaoEmAndamento) {
      console.warn('Já existe uma geração de quiz em andamento.');
      return;
    }

    // Verificar limites do plano
    const subscriptionStore = useSubscriptionStore.getState();
    if (!subscriptionStore.canGenerateQuiz(questionCount)) {
      const maxQuestions = subscriptionStore.getMaxQuizQuestionsPerDay();
      const current = subscriptionStore.quizQuestionsGeneratedToday;
      const remaining = Math.max(0, maxQuestions - current);

      if (maxQuestions === 0) {
        toast.error('Quiz IA disponível apenas para planos Pro e Premium. Faça upgrade para continuar!');
      } else {
        toast.error(`Limite diário atingido! Você pode gerar até ${maxQuestions} questões por dia. Restam ${remaining} questões hoje.`);
      }
      return;
    }

    const geracaoId = `quiz-${Date.now()}`;

    // Definir estado persistente de geração em andamento
    set({
      isGenerating: true,
      generationProgress: 0,
      geracaoEmAndamento: {
        id: geracaoId,
        quizMode,
        disciplineName,
        questionCount,
        difficulty,
        dataInicio: new Date().toISOString()
      }
    });

    toast.info("Geração de quiz iniciada. A IA está criando suas questões...");

    try {
      // Obter banca do edital ativo
      const editalAtivo = useEditalStore.getState().editalAtivo;
      const banca = editalAtivo?.banca || undefined;

      // Gerar questões em lote
      const batchQuestions = await import('../services/geminiService').then(m =>
        m.gerarBatchQuiz(disciplineName, quizMode, questionCount, banca, topicos, difficulty)
      );

      const questions: QuizQuestion[] = batchQuestions.map((q, index) => ({
        flashcard: {
          id: `generated-${Date.now()}-${index}`,
          topico_id: 'generated',
          pergunta: q.question,
          resposta: q.correctAnswer,
          interval: 0,
          easeFactor: 2.5,
          dueDate: new Date().toISOString()
        },
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }));

      // Salvar quiz no banco de dados
      if (questions.length > 0) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
            const { error } = await supabase
              .from('quizzes')
              .insert({
                user_id: userData.user.id,
                title: disciplineName ? `Quiz de ${disciplineName}` : 'Quiz Gerado',
                mode: quizMode,
                questions: questions,
                created_at: new Date().toISOString(),
                "studyPlanId": editalAtivo?.id
              });

            if (error) console.error('Erro ao salvar quiz:', error);
          }
        } catch (err) {
          console.error('Erro ao salvar quiz (catch):', err);
        }
      }

      const now = Date.now();
      const session: QuizSession = {
        questions,
        currentQuestionIndex: 0,
        answers: {},
        startTime: now,
        questionStartTime: now,
        timerEnabled,
        timeLimit: timerEnabled ? 60 : undefined, // 60 segundos por padrão
        completed: false
      };

      // Incrementar contador de questões geradas
      const subscriptionStore = useSubscriptionStore.getState();
      subscriptionStore.incrementQuizQuestionCount(questionCount);

      // Registrar geração no banco de dados (não bloquear se falhar)
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await recordQuizGeneration(userData.user.id, questionCount);
        }
      } catch (err) {
        console.error('Erro ao registrar geração de quiz:', err);
        // Não bloquear a geração se o registro falhar
      }

      set({ session, isGenerating: false, generationProgress: 100, geracaoEmAndamento: null });
    } catch (error) {
      console.error('Erro ao iniciar quiz:', error);
      set({ isGenerating: false, generationProgress: 0, geracaoEmAndamento: null });
      toast.error('Erro ao gerar quiz. Tente novamente.');
      throw error;
    }
  },

  loadSavedQuiz: (quiz: Quiz, timerEnabled: boolean = false) => {
    const now = Date.now();
    const session: QuizSession = {
      questions: quiz.questions,
      currentQuestionIndex: 0,
      answers: {},
      startTime: now,
      questionStartTime: now,
      timerEnabled,
      timeLimit: timerEnabled ? 60 : undefined,
      completed: false
    };

    set({ session, isGenerating: false, generationProgress: 100, geracaoEmAndamento: null });
    toast.success(`Quiz "${quiz.title}" carregado com sucesso!`);
  },

  resetQuiz: () => {
    try {
      localStorage.removeItem(QUIZ_SESSION_KEY);
    } catch (e) {
      console.error('Erro ao limpar sessão de quiz:', e);
    }
    set({ session: null, isGenerating: false, generationProgress: 0, geracaoEmAndamento: null });
  },

  answerQuestion: (answer: string) => {
    const { session } = get();
    if (!session) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    if (!currentQuestion) return;

    const isCorrect = answer === currentQuestion.correctAnswer;
    const timeSpent = Date.now() - session.questionStartTime;

    set({
      session: {
        ...session,
        answers: {
          ...session.answers,
          [session.currentQuestionIndex]: {
            selected: answer,
            correct: isCorrect,
            timeSpent,
          },
        },
      },
    });
  },

  nextQuestion: () => {
    const { session } = get();
    if (!session) return;

    if (session.currentQuestionIndex < session.questions.length - 1) {
      set({
        session: {
          ...session,
          currentQuestionIndex: session.currentQuestionIndex + 1,
          questionStartTime: Date.now(),
        },
      });
    }
  },

  getCurrentQuestion: (): QuizQuestion | null => {
    const { session } = get();
    if (!session) return null;
    return session.questions[session.currentQuestionIndex] || null;
  },

  isQuizComplete: (): boolean => {
    const { session } = get();
    if (!session) return false;
    return session.currentQuestionIndex >= session.questions.length - 1;
  },

  endQuiz: (): QuizResult | null => {
    const { session } = get();
    if (!session) return null;

    const totalQuestions = session.questions.length;
    const answers = Object.values(session.answers);
    const correctAnswers = answers.filter(a => a.correct).length;
    const incorrectAnswers = answers.filter(a => !a.correct).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const totalTime = Date.now() - session.startTime;
    const averageTimePerQuestion =
      answers.length > 0
        ? answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length
        : 0;

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      accuracy,
      totalTime,
      averageTimePerQuestion,
    };
  },

  completeQuiz: () => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        completed: true
      }
    });
  },

  clearPersistedSession: () => {
    try {
      localStorage.removeItem(QUIZ_SESSION_KEY);
    } catch (e) {
      console.error('Erro ao limpar sessão persistida:', e);
    }
  },
}));

// Persistir session automaticamente no localStorage
useQuizStore.subscribe((state) => {
  try {
    if (state.session) {
      localStorage.setItem(QUIZ_SESSION_KEY, JSON.stringify(state.session));
    }
  } catch (e) {
    console.error('Erro ao persistir sessão de quiz:', e);
  }
});
