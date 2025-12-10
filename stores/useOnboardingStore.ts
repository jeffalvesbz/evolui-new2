import { create } from 'zustand';
import { supabase } from '../services/supabaseClient';

interface OnboardingState {
  hasSeenOnboarding: boolean | null;
  isLoading: boolean;
  checkOnboardingStatus: (userId: string) => Promise<void>;
  markOnboardingAsSeen: (userId: string) => Promise<void>;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: null,
  isLoading: false,

  checkOnboardingStatus: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Primeiro, tenta buscar do perfil no Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('has_seen_onboarding')
        .eq('user_id', userId)
        .single();

      // Se o perfil não existe (PGRST116 = no rows returned), cria ele
      if (error && error.code === 'PGRST116') {
        const { data: user } = await supabase.auth.getUser();
        if (user?.user) {
          // Cria o perfil se não existir
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              name: user.user.user_metadata?.name || user.user.email || 'Usuário',
              email: user.user.email || '',
              xp_total: 0,
              current_streak_days: 0,
              best_streak_days: 0,
              has_seen_onboarding: false
            });

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
            // Fallback para localStorage
            const localStatus = localStorage.getItem(`onboarding_seen_${userId}`);
            set({ hasSeenOnboarding: localStatus === 'true', isLoading: false });
            return;
          }

          // Perfil criado, retorna false
          set({ hasSeenOnboarding: false, isLoading: false });
          return;
        }
      }

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar status do onboarding:', error);
        // Fallback para localStorage
        const localStatus = localStorage.getItem(`onboarding_seen_${userId}`);
        set({ hasSeenOnboarding: localStatus === 'true', isLoading: false });
        return;
      }

      // Se o perfil existe e tem o campo, usa ele
      if (profile && profile.has_seen_onboarding !== undefined) {
        set({ hasSeenOnboarding: profile.has_seen_onboarding, isLoading: false });
        return;
      }

      // Se não tem o campo, verifica localStorage como fallback
      const localStatus = localStorage.getItem(`onboarding_seen_${userId}`);
      set({ hasSeenOnboarding: localStatus === 'true', isLoading: false });
    } catch (error) {
      console.error('Erro ao verificar status do onboarding:', error);
      // Fallback para localStorage
      const currentUserId = (await supabase.auth.getUser()).data.user?.id;
      if (currentUserId) {
        const localStatus = localStorage.getItem(`onboarding_seen_${currentUserId}`);
        set({ hasSeenOnboarding: localStatus === 'true', isLoading: false });
      } else {
        set({ hasSeenOnboarding: false, isLoading: false });
      }
    }
  },

  markOnboardingAsSeen: async (userId: string) => {
    try {
      // Tenta atualizar o perfil no Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_seen_onboarding: true })
        .eq('user_id', userId);

      // Se não conseguir atualizar (perfil não existe), cria o perfil
      if (updateError) {
        const { data: user } = await supabase.auth.getUser();
        if (user?.user) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              user_id: userId,
              name: user.user.user_metadata?.name || user.user.email || 'Usuário',
              email: user.user.email || '',
              xp_total: 0,
              current_streak_days: 0,
              best_streak_days: 0,
              has_seen_onboarding: true
            });

          if (insertError) {
            console.warn('Não foi possível criar/atualizar perfil no Supabase, usando localStorage:', insertError);
          }
        } else {
          console.warn('Não foi possível atualizar no Supabase, usando localStorage:', updateError);
        }
      }

      // Sempre salva no localStorage como backup
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
      set({ hasSeenOnboarding: true });
    } catch (error) {
      console.error('Erro ao marcar onboarding como visto:', error);
      // Fallback para localStorage
      localStorage.setItem(`onboarding_seen_${userId}`, 'true');
      set({ hasSeenOnboarding: true });
    }
  },

  resetOnboarding: () => {
    set({ hasSeenOnboarding: false });
  },
}));

