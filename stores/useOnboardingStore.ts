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

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const localStatus = localStorage.getItem(`onboarding_seen_${userId}`);
        set({ hasSeenOnboarding: localStatus === 'true', isLoading: false });
      } else {
        set({ hasSeenOnboarding: false, isLoading: false });
      }
    }
  },

  markOnboardingAsSeen: async (userId: string) => {
    try {
      // Tenta salvar no Supabase primeiro
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_seen_onboarding: true })
        .eq('user_id', userId);

      if (updateError) {
        // Se não conseguir atualizar (pode ser que o perfil não exista ainda ou o campo não exista)
        // Apenas salva no localStorage - o perfil será criado/atualizado em outro lugar do sistema
        console.warn('Não foi possível atualizar no Supabase, usando localStorage:', updateError);
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

