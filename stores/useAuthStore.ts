import { create } from 'zustand';
import { User } from '../types';
import { login as loginApi } from '../services/geminiService';
import { toast } from '../components/Sonner';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  
  login: async (email, password) => {
    set({ loading: true });
    try {
      const { token, user } = await loginApi(email, password);
      localStorage.setItem('authToken', token);
      set({ user, token, isAuthenticated: true, loading: false });
    } catch (error) {
      console.error("Login failed:", error);
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    set({ user: null, token: null, isAuthenticated: false });
    // Opcional: redirecionar para a página de login
    window.location.reload();
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Em um app real, você validaria o token com o backend aqui
        // e buscaria os dados do usuário.
        const MOCK_USER: User = { id: 'user-1', name: 'Jefferson Alves', email: 'test@evolui.app' };
        set({ user: MOCK_USER, token, isAuthenticated: true });
    } else {
        set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));