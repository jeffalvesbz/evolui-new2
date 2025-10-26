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
      // Em um app real, a API retornaria o token e os dados do usuário
      // const { token, user } = await loginApi(email, password);
      
      // MOCK para demonstração sem backend real
      if (email === 'test@evolui.app') {
        const MOCK_TOKEN = 'fake-jwt-token-for-testing';
        const MOCK_USER: User = { id: 'user-1', name: 'Jefferson Alves', email: 'test@evolui.app' };
        localStorage.setItem('authToken', MOCK_TOKEN);
        set({ user: MOCK_USER, token: MOCK_TOKEN, isAuthenticated: true });
      } else {
        throw new Error("Credenciais inválidas.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      set({ loading: false });
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