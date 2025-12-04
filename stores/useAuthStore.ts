import { create } from 'zustand';
import { User } from '../types';
<<<<<<< HEAD
=======
import { login as loginApi, signup as signupApi } from '../services/geminiService';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
import { toast } from '../components/Sonner';
import { supabase } from '../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
<<<<<<< HEAD
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: false,
<<<<<<< HEAD

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
=======
  
  login: async (email, password) => {
    set({ loading: true });
    try {
      await loginApi(email, password);
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      // onAuthStateChange will handle setting the user state
    } catch (error) {
      console.error("Login failed:", error);
      set({ loading: false });
      throw error;
    } finally {
<<<<<<< HEAD
      set({ loading: false });
=======
        set({ loading: false });
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    }
  },

  signup: async (email, password, name) => {
    set({ loading: true });
    try {
<<<<<<< HEAD
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
=======
        await signupApi(email, password, name);
    } catch (error) {
        console.error("Signup failed:", error);
        throw error;
    } finally {
        set({ loading: false });
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
  },
<<<<<<< HEAD

  checkAuth: () => {
    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (user) {
        set({
          user: {
            id: user.id,
            name: user.user_metadata.name || 'Usuário',
            email: user.email || ''
          },
          session,
          isAuthenticated: true
        });
      } else {
        set({ user: null, session: null, isAuthenticated: false });
      }
=======
  
  checkAuth: () => {
    supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        if (user) {
            set({ 
                user: {
                    id: user.id,
                    name: user.user_metadata.name || 'Usuário',
                    email: user.email || ''
                },
                session, 
                isAuthenticated: true 
            });
        } else {
            set({ user: null, session: null, isAuthenticated: false });
        }
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    });
  },
}));