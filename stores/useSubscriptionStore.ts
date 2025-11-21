import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

type PlanType = 'free' | 'pro' | 'premium';

interface SubscriptionState {
  planType: PlanType;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  loading: boolean;
  fetchSubscription: () => Promise<void>;
  startTrial: (planType: 'pro' | 'premium') => Promise<void>;
  canCreateEdital: (currentCount: number) => boolean;
  getMaxEditais: () => number;
  canCreateCiclo: (currentCount: number) => boolean;
  getMaxCiclos: () => number;
  canCorrectRedacao: (currentMonthCount: number) => boolean;
  getMaxRedacoesPerMonth: () => number;
  canAccessPlanning: () => boolean;
  canAccessTimer: () => boolean;
  hasActiveSubscription: () => boolean;
  isTrialActive: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  planType: 'free',
  trialEndsAt: null,
  subscriptionEndsAt: null,
  loading: false,

  fetchSubscription: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan_type, trial_ends_at, subscription_ends_at')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Erro ao buscar dados de assinatura:', error);
        set({ loading: false });
        return;
      }

      set({
        planType: (profile?.plan_type as PlanType) || 'free',
        trialEndsAt: profile?.trial_ends_at || null,
        subscriptionEndsAt: profile?.subscription_ends_at || null,
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

      // Calcular data de término do trial (7 dias a partir de agora)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);
      const trialEndsAtISO = trialEndsAt.toISOString();

      // Atualizar perfil com o plano e data de término do trial
      const { error } = await supabase
        .from('profiles')
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
    // Sempre permitir criar editais (sem limitações)
    return true;
  },

  getMaxEditais: () => {
    // Sempre retornar ilimitado (representado por -1)
    return -1;
  },

  hasActiveSubscription: () => {
    const state = get();

    if (state.planType === 'free') {
      return false;
    }

    if (!state.subscriptionEndsAt) {
      return false;
    }

    const now = new Date();
    const endsAt = new Date(state.subscriptionEndsAt);
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
    // Sempre permitir criar ciclos (sem limitações)
    return true;
  },

  getMaxCiclos: () => {
    // Sempre retornar ilimitado (representado por -1)
    return -1;
  },

  canCorrectRedacao: (currentMonthCount: number) => {
    // Sempre permitir corrigir redações (sem limitações)
    return true;
  },

  getMaxRedacoesPerMonth: () => {
    // Sempre retornar ilimitado (representado por -1)
    return -1;
  },

  canAccessPlanning: () => {
    // Sempre permitir acesso ao planejamento (sem limitações)
    return true;
  },

  canAccessTimer: () => {
    // Sempre permitir acesso ao timer (sem limitações)
    return true;
  },
}));
