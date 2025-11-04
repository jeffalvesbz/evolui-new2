import { create } from 'zustand';
import { User } from '../types';
import { login as loginApi } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const mapAuthUser = (user: User | null, token: string | null) => ({
  user,
  token,
  isAuthenticated: Boolean(user && token),
});

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
      set({ ...mapAuthUser(user, token), loading: false });
    } catch (error) {
      console.error("Login failed:", error);
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
    localStorage.removeItem('authToken');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.reload();
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        localStorage.removeItem('authToken');
        set({ user: null, token: null, isAuthenticated: false, loading: false });
        return;
      }

      const token = session.access_token;
      localStorage.setItem('authToken', token);

      const authUser = session.user;
      const { data: profile, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
      }

      const mappedUser: User = profile
        ? { id: profile.id, name: profile.name ?? authUser.email ?? 'Usuário', email: profile.email ?? authUser.email ?? '' }
        : {
            id: authUser.id,
            name: (authUser.user_metadata?.name as string | undefined) ?? authUser.email ?? 'Usuário',
            email: authUser.email ?? '',
          };

      set({ ...mapAuthUser(mappedUser, token), loading: false });
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      toast.error('Não foi possível validar sua sessão. Faça login novamente.');
      localStorage.removeItem('authToken');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },
}));