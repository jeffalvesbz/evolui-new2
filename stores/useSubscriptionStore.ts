import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';
import { countFlashcardsCreatedThisMonth } from '../services/geminiService';
import { countQuizQuestionsToday } from '../services/quizStatsService';

type PlanType = 'free' | 'pro' | 'premium';

interface SubscriptionState {
  planType: PlanType;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  stripeCustomerId: string | null;
  loading: boolean;
  flashcardsCreatedThisMonth: number;
  quizQuestionsGeneratedToday: number;
  fetchSubscription: () => Promise<void>;
  startTrial: (planType: 'pro' | 'premium') => Promise<void>;
  canCreateEdital: (currentCount: number) => boolean;
  getMaxEditais: () => number;
  canCreateCiclo: (currentCount: number) => boolean;
  getMaxCiclos: () => number;
  canCorrectRedacao: (currentMonthCount: number) => boolean;
  getMaxRedacoesPerMonth: () => number;
  canCreateFlashcard: (count?: number) => boolean;
  getMaxFlashcardsPerMonth: () => number;
  incrementFlashcardCount: (amount?: number) => void;
  canGenerateQuiz: (questionCount: number) => boolean;
  getMaxQuizQuestionsPerDay: () => number;
  incrementQuizQuestionCount: (questionCount: number) => void;
  canAccessPlanning: () => boolean;
  canAccessTimer: () => boolean;
  canAccessOCR: () => boolean;
  hasActiveSubscription: () => boolean;
  isTrialActive: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planType: 'free',
  trialEndsAt: null,
  subscriptionEndsAt: null,
  stripeCustomerId: null,
  loading: false,
  flashcardsCreatedThisMonth: 0,
  quizQuestionsGeneratedToday: 0,

  fetchSubscription: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }

      const [profileResult, flashcardsCount, quizQuestionsCount] = await Promise.all([
        supabase
          .from('profiles')
          .select('plan_type, trial_ends_at, subscription_ends_at, stripe_customer_id')
          .eq('user_id', user.id)
          .single(),
        countFlashcardsCreatedThisMonth(user.id),
        countQuizQuestionsToday(user.id)
      ]);

      const { data: profileData, error } = profileResult;
      const profile = profileData as any;

      if (error || !profile) {
        console.error('Erro ao buscar dados de assinatura:', error);
        set({ loading: false });
        return;
      }

      set({
        planType: (profile?.plan_type ?? 'free') as PlanType,
        trialEndsAt: profile?.trial_ends_at ?? null,
        subscriptionEndsAt: profile?.subscription_ends_at ?? null,
        stripeCustomerId: profile?.stripe_customer_id ?? null,
        flashcardsCreatedThisMonth: flashcardsCount,
        quizQuestionsGeneratedToday: quizQuestionsCount,
        loading: false,
      });
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
      set({ loading: false });
    }
  },

  startTrial: async (planType: 'pro' | 'premium') => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se já tem trial ativo
      const state = get();
      if (state.isTrialActive()) {
        throw new Error('Você já possui um teste grátis ativo!');
      }

      // Calcular data de término do trial (3 dias a partir de agora)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 3);
      const trialEndsAtISO = trialEndsAt.toISOString();

      // Atualizar perfil com o plano e data de término do trial
      const { error } = await supabase
        .from('profiles')
        // @ts-ignore
        .update({
          plan_type: planType,
          trial_ends_at: trialEndsAtISO,
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Atualizar o estado local
      set({
        planType,
        trialEndsAt: trialEndsAtISO,
        loading: false,
      });

      return;
    } catch (error: any) {
      console.error('Erro ao iniciar trial:', error);
      set({ loading: false });
      throw error;
    }
  },

  canCreateEdital: (currentCount: number) => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return true;
    if (state.planType === 'pro' && isActive) return currentCount < 3;

    return currentCount < 1;
  },

  getMaxEditais: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return -1;
    if (state.planType === 'pro' && isActive) return 3;

    return 1;
  },

  hasActiveSubscription: () => {
    const state = get();

    if (state.planType === 'free') {
      return false;
    }

    // Se não tiver data de término, mas o plano não for free, assume ativo (ex: vitalício ou erro de sync)
    if (!state.subscriptionEndsAt) {
      return true;
    }

    const now = new Date();
    const endsAt = new Date(state.subscriptionEndsAt);
    // Adiciona uma tolerância de 1 dia para evitar bloqueios por fuso horário
    endsAt.setDate(endsAt.getDate() + 1);

    return endsAt > now;
  },

  isTrialActive: () => {
    const state = get();

    if (!state.trialEndsAt) {
      return false;
    }

    const now = new Date();
    const endsAt = new Date(state.trialEndsAt);
    return endsAt > now;
  },

  canCreateCiclo: (currentCount: number) => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return true;
    if (state.planType === 'pro' && isActive) return currentCount < 3;

    return currentCount < 1;
  },

  getMaxCiclos: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return -1;
    if (state.planType === 'pro' && isActive) return 3;

    return 1;
  },

  canCorrectRedacao: (currentMonthCount: number) => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return true;
    if (state.planType === 'pro' && isActive) return currentMonthCount < 10;

    return false;
  },

  getMaxRedacoesPerMonth: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return -1;
    if (state.planType === 'pro' && isActive) return 10;

    return 0;
  },

  canCreateFlashcard: (count = 1) => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();
    const current = state.flashcardsCreatedThisMonth;

    if (state.planType === 'premium' && isActive) {
      return (current + count) <= 2000;
    }
    if (state.planType === 'pro' && isActive) {
      return (current + count) <= 500;
    }

    // Free limits (default)
    return (current + count) <= 50;
  },

  getMaxFlashcardsPerMonth: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (state.planType === 'premium' && isActive) return 2000;
    if (state.planType === 'pro' && isActive) return 500;
    return 50; // Free
  },

  incrementFlashcardCount: (amount = 1) => {
    set(state => ({ flashcardsCreatedThisMonth: state.flashcardsCreatedThisMonth + amount }));
  },

  canGenerateQuiz: (questionCount: number) => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();
    const current = state.quizQuestionsGeneratedToday;

    // Free: sem acesso a quiz IA
    if (!isActive && state.planType === 'free') {
      return false;
    }

    // Pro: 30 questões/dia
    if (state.planType === 'pro' && isActive) {
      return (current + questionCount) <= 30;
    }

    // Premium: 100 questões/dia
    if (state.planType === 'premium' && isActive) {
      return (current + questionCount) <= 100;
    }

    return false;
  },

  getMaxQuizQuestionsPerDay: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    if (!isActive && state.planType === 'free') return 0;
    if (state.planType === 'pro' && isActive) return 30;
    if (state.planType === 'premium' && isActive) return 100;
    return 0;
  },

  incrementQuizQuestionCount: (questionCount: number) => {
    set(state => ({ quizQuestionsGeneratedToday: state.quizQuestionsGeneratedToday + questionCount }));
  },

  canAccessPlanning: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    // Planejamento semanal apenas PRO+ com assinatura ativa
    return (state.planType === 'pro' || state.planType === 'premium') && isActive;
  },

  canAccessTimer: () => {
    // Timer disponível para todos os planos
    return true;
  },

  canAccessOCR: () => {
    const state = get();
    const isActive = state.hasActiveSubscription() || state.isTrialActive();

    // OCR apenas para PREMIUM com assinatura ativa
    return state.planType === 'premium' && isActive;
  },
}));
