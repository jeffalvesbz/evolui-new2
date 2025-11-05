

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CicloDeEstudos from './components/CicloDeEstudos';
import TrilhaSemanal from './components/TrilhaSemanal';
import HistoricoPage from './components/HistoricoPage';
import PlaceholderView from './components/PlaceholderView';
import ThemeSwitcher from './components/ThemeSwitcher';
import Edital from './components/Edital';
import FlashcardsPage from './components/FlashcardsPage';
import Simulados from './components/Simulados';
import RevisoesPage from './components/RevisoesPage';
import CadernoErros from './components/CadernoErros';
import CorretorRedacao from './components/CorretorRedacao';
import Breadcrumb from './components/Breadcrumb';
import { BellIcon, PlusCircleIcon, PlayCircleIcon, SettingsIcon, LandmarkIcon, CheckCircle2Icon } from './components/icons';
import { Theme, User } from './types';
import { useEstudosStore } from './stores/useEstudosStore';
import { Toaster, toast } from './components/Sonner';
import { useEditalStore } from './stores/useEditalStore';
import { useDisciplinasStore } from './stores/useDisciplinasStore';
import { useRevisoesStore } from './stores/useRevisoesStore';
import { useCadernoErrosStore } from './stores/useCadernoErrosStore';
import EditalManagementModal from './components/EditalManagementModal';
import { useModalStore } from './stores/useModalStore';
import Estatisticas from './components/Estatisticas';
import { useCiclosStore } from './stores/useCiclosStore';
import CronometroInteligente from './components/CronometroInteligente';
import SalvarSessaoModal from './components/SalvarSessaoModal';
import AdicionarTopicoModal from './components/AdicionarTopicoModal';
import CriarCicloModal from './components/CriarCicloModal';
import { useFlashcardsStore } from './stores/useFlashcardStore';
import { useDailyGoalStore } from './stores/useDailyGoalStore';
import { useStudyStore } from './stores/useStudyStore';
import { useRedacaoStore } from './stores/useRedacaoStore';
import { usePlanejamento } from './stores/usePlanejamento';
import { useAuthStore } from './stores/useAuthStore';
import { useGamificationStore } from './stores/useGamificationStore';
import HeaderXPChip from './components/HeaderXPChip';
import GamificationPage from './components/GamificationPage';
import AchievementNotifier from './components/AchievementNotifier';
import GeradorPlanoModal from './components/GeradorPlanoModal';
import { useFriendsStore } from './stores/useFriendsStore';
import CriarFlashcardModal from './components/CriarFlashcardModal';
import MobileHeader from './components/MobileHeader';
import QuickStartTimerButton from './components/QuickStartTimerButton';

// Hook para buscar dados dos stores quando o edital ativo muda
const useEditalDataSync = () => {
    const { editalAtivo } = useEditalStore();
    const { fetchDisciplinas } = useDisciplinasStore();
    const { fetchRevisoes } = useRevisoesStore();
    const { fetchErros } = useCadernoErrosStore();
    const { fetchSessoes } = useEstudosStore();
    const { fetchCiclos } = useCiclosStore();
    const { fetchRedacoes } = useRedacaoStore();
    const { fetchSimulados } = useStudyStore();

    useEffect(() => {
        if (editalAtivo?.id) {
            console.log(`Buscando todos os dados para o plano de estudo: ${editalAtivo.nome}`);
            // ✅ Corrigido: As funções de fetch agora recebem `editalAtivo.id` que representa o `studyPlanId`.
            Promise.all([
                fetchDisciplinas(editalAtivo.id),
                fetchRevisoes(editalAtivo.id),
                fetchErros(editalAtivo.id),
                fetchSessoes(editalAtivo.id),
                fetchCiclos(editalAtivo.id),
                fetchRedacoes(editalAtivo.id),
                fetchSimulados(editalAtivo.id),
            ]).catch(err => {
                console.error("Falha ao buscar dados do plano de estudo", err);
                toast.error("Não foi possível carregar os dados do plano de estudo.");
            });
        }
    }, [editalAtivo?.id]);
};

// Hook para buscar dados de gamificação
const useGamificationDataSync = () => {
    const { user } = useAuthStore();
    const { fetchGamificationStats, fetchBadges, fetchXpLog } = useGamificationStore();

    useEffect(() => {
        if (user?.id) {
            fetchGamificationStats(user.id);
            fetchBadges();
            fetchXpLog(user.id);
        }
    }, [user?.id, fetchGamificationStats, fetchBadges, fetchXpLog]);
};

// Hook to fetch friends data
const useFriendsDataSync = () => {
    const { user } = useAuthStore();
    const { fetchFriends, fetchFriendRequests } = useFriendsStore();

    useEffect(() => {
        if (user?.id) {
            fetchFriends(user.id);
            fetchFriendRequests(user.id);
        }
    }, [user?.id, fetchFriends, fetchFriendRequests]);
}


const Header: React.FC<{ theme: Theme; toggleTheme: () => void; activeView: string; }> = ({ theme, toggleTheme, activeView }) => {
  const openEstudoModal = useEstudosStore(state => state.iniciarSessaoInteligente);
  const user = useAuthStore(state => state.user);
  
  return (
    <header className="sticky top-0 z-30 hidden lg:flex items-center justify-between h-[73px] px-6 border-b border-white/10 bg-card/50 backdrop-blur-lg flex-shrink-0">
       <Breadcrumb activeView={activeView} setActiveView={() => {}} />
      <div className="flex items-center gap-2">
          <HeaderXPChip />
          <button onClick={openEstudoModal} className="h-9 px-4 flex items-center gap-2 rounded-lg bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
            <PlusCircleIcon className="w-4 h-4" />
            Registrar estudo
          </button>
          
          <button className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-black/20 text-muted-foreground hover:bg-black/30 transition-colors">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
          </button>
          
          <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} /> 
          
          {user && (
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.name.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground">Estudante</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-black flex items-center justify-center rounded-full font-bold text-lg">
                {user.name.charAt(0)}
              </div>
            </div>
          )}
      </div>
    </header>
  );
};

const AuthGate: React.FC = () => {
    const { login, signup } = useAuthStore();
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (authMode === 'login') {
                await login(email, password);
                // The onAuthStateChange listener will handle the successful login
            } else {
                await signup(email, password, name);
                toast.success('Conta criada! Verifique seu email para confirmar.');
                setAuthMode('login'); // Switch to login after signup
            }
        } catch (err: any) {
            setError(err.message || 'Falha na autenticação. Verifique suas credenciais.');
            toast.error(err.message || 'Falha na autenticação.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-sm p-8 space-y-6 glass-card rounded-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Bem-vindo ao Evolui</h1>
                    <p className="text-muted-foreground mt-2">
                        {authMode === 'login' ? 'Faça login para continuar' : 'Crie sua conta para começar'}
                    </p>
                </div>

                <div className="flex bg-muted/50 p-1 rounded-lg">
                    <button onClick={() => setAuthMode('login')} className={`w-1/2 p-2 rounded-md text-sm font-semibold ${authMode === 'login' ? 'bg-card shadow' : 'text-muted-foreground'}`}>Entrar</button>
                    <button onClick={() => setAuthMode('signup')} className={`w-1/2 p-2 rounded-md text-sm font-semibold ${authMode === 'signup' ? 'bg-card shadow' : 'text-muted-foreground'}`}>Registrar</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     {authMode === 'signup' && (
                         <div>
                            <label className="text-sm font-medium text-muted-foreground">Nome</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                         </div>
                     )}
                     <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                     </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground">Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"/>
                     </div>
                     {error && <p className="text-xs text-red-500">{error}</p>}
                     <button type="submit" disabled={loading} className="w-full h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        {loading ? 'Processando...' : (authMode === 'login' ? 'Entrar' : 'Criar Conta')}
                     </button>
                </form>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeView, setActiveView] = useState('dashboard'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const editalAtivo = useEditalStore(state => state.editalAtivo);
  
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { fetchEditais } = useEditalStore();

  const { unlockBadges, badges, stats, updateStreak } = useGamificationStore();
  const { sessoes } = useEstudosStore();
  const { simulations } = useStudyStore();
  const themeToggleCount = React.useRef(0);
  const themeToggleTimeout = React.useRef<number | null>(null);
  
  // Initialize auth state listener
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  // Fetch initial data once authenticated
  useEffect(() => {
    const loadInitialData = async () => {
        setIsAppLoading(true);
        try {
            await fetchEditais();
        } catch (error) {
            console.error("Failed to load initial data:", error);
            toast.error("Falha ao carregar dados iniciais.");
        } finally {
            setIsAppLoading(false);
        }
    };
    if (isAuthenticated) {
        loadInitialData();
    } else {
        // If not authenticated, stop loading to show AuthGate
        setIsAppLoading(false);
    }
  }, [isAuthenticated, fetchEditais]);

  useEditalDataSync();
  useGamificationDataSync();
  useFriendsDataSync();

  // Effect to keep the streak in sync with the database
  useEffect(() => {
    if (isAuthenticated) {
        updateStreak();
    }
  }, [sessoes, simulations, isAuthenticated, updateStreak]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    
    if (themeToggleTimeout.current) {
        clearTimeout(themeToggleTimeout.current);
    }
    themeToggleCount.current++;

    if (themeToggleCount.current >= 5) {
        const matrixBadge = badges.find(b => b.id === 'badge-secret-1');
        const isUnlocked = stats?.unlockedBadgeIds.includes('badge-secret-1');

        if (matrixBadge && !isUnlocked) {
            unlockBadges([matrixBadge]);
        }
        themeToggleCount.current = 0;
    }

    themeToggleTimeout.current = window.setTimeout(() => {
        themeToggleCount.current = 0;
    }, 3000); // Reset after 3 seconds of inactivity
  };
  
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard setActiveView={setActiveView} />;
      case 'planejamento': return <TrilhaSemanal />;
      case 'ciclos': return <CicloDeEstudos />;
      case 'historico': return <HistoricoPage setActiveView={setActiveView} />;
      case 'edital': return <Edital />;
      case 'flashcards': return <FlashcardsPage />;
      case 'simulados': return <Simulados />;
      case 'revisoes': return <RevisoesPage />;
      case 'erros': return <CadernoErros />;
      case 'estatisticas': return <Estatisticas />;
      case 'corretor': return <CorretorRedacao />;
      case 'gamificacao': return <GamificationPage />;
      default: return <Dashboard setActiveView={setActiveView} />;
    }
  };

  if (isAppLoading) {
     return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <LandmarkIcon className="w-16 h-16 text-primary animate-pulse mb-4" />
            <h2 className="text-2xl font-bold">Carregando seus dados...</h2>
            <p className="text-muted-foreground">Aguarde um momento.</p>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans dark overflow-hidden">
      <Toaster />
      <AchievementNotifier />
      <SalvarSessaoModal />
      <EditalManagementModal />
      <AdicionarTopicoModal />
      <CriarCicloModal />
      <GeradorPlanoModal />
      <CriarFlashcardModal />

      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="w-full h-8 bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs font-bold text-black shadow-lg z-20 flex-shrink-0">
            Plano de Estudo Ativo: {editalAtivo?.nome || 'Nenhum plano selecionado'} ({editalAtivo?.data_alvo.split('-')[0] || ''})
        </div>
        <Header theme={theme} toggleTheme={toggleTheme} activeView={activeView} />
        <MobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-5xl mx-auto">
            {renderActiveView()}
          </div>
          
          <QuickStartTimerButton />
          <CronometroInteligente />
        </main>
      </div>
    </div>
  );
};

export default App;