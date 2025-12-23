import { create } from 'zustand';
import { User } from '../types';
import { toast } from '../components/Sonner';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  isPasswordRecovery: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: false,
  isPasswordRecovery: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // onAuthStateChange will handle setting the user state
    } catch (error) {
      console.error("Login failed:", error);
      set({ loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email, password, name) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithOAuth: async (provider: 'google' | 'github') => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: import.meta.env.VITE_APP_URL || window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error(`OAuth login failed (${provider}):`, error);
      set({ loading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL || window.location.origin}/reset-password`,
      });
      if (error) throw error;
    } catch (error) {
      console.error("Password reset failed:", error);
      set({ loading: false });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false, isPasswordRecovery: false });
  },

  checkAuth: () => {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`);

      const user = session?.user;

      // Detecção robusta de recovery: evento OU URL
      const isRecoveryEvent = event === 'PASSWORD_RECOVERY';
      const isRecoveryUrl = window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery') ||
        (window as any).__IS_RECOVERY_FLOW__ === true ||
        sessionStorage.getItem('evolui_recovery_flow') === 'true';

      const isRecovery = isRecoveryEvent || isRecoveryUrl;

      if (isRecovery) {
        console.log('🔒 Modo de recuperação detectado - Forçando flag via LocalStorage');
        localStorage.setItem('evolui_force_reset', 'true');
        set({ isPasswordRecovery: true });
      } else if (localStorage.getItem('evolui_force_reset') === 'true') {
        // Se a flag persistente existir, restaurar o modo de recovery
        console.log('🔒 Modo de recuperação restaurado via LocalStorage');
        set({ isPasswordRecovery: true });
      }

      if (user) {
        set((state) => ({
          user: {
            id: user.id,
            name: user.user_metadata.name || 'Usuário',
            email: user.email || ''
          },
          session,
          isAuthenticated: true,
          // Mantém true se já for true OU se tivermos a flag no localStorage
          isPasswordRecovery: state.isPasswordRecovery || isRecovery || localStorage.getItem('evolui_force_reset') === 'true'
        }));
      } else {
        // Se fez logout, limpar tudo se não for recovery
        const shouldClearRecovery = event === 'SIGNED_OUT' && !isRecovery;
        if (shouldClearRecovery) {
          localStorage.removeItem('evolui_force_reset');
          set({ user: null, session: null, isAuthenticated: false, isPasswordRecovery: false });
        } else {
          set({ user: null, session: null, isAuthenticated: false });
        }
      }
    });
  },
}));