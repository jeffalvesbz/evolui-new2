

import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import { useNavigation } from './hooks/useNavigation';
import PlaceholderView from './components/PlaceholderView';
import ThemeSwitcher from './components/ThemeSwitcher';
import { AppRoutes } from './routes';
import Breadcrumb from './components/Breadcrumb';
import { BellIcon, PlusCircleIcon, PlayCircleIcon, SettingsIcon, LandmarkIcon, CheckCircle2Icon } from './components/icons';
import { Theme, User } from './types';
import { useEstudosStore } from './stores/useEstudosStore';
import { Toaster, toast } from './components/Sonner';
import { useEditalStore } from './stores/useEditalStore';
import { useDisciplinasStore } from './stores/useDisciplinasStore';
import { useRevisoesStore } from './stores/useRevisoesStore';
import { useCadernoErrosStore } from './stores/useCadernoErrosStore';
import { useModalStore } from './stores/useModalStore';
import Estatisticas from './components/Estatisticas';
import { useCiclosStore } from './stores/useCiclosStore';
import { useFlashcardsStore } from './stores/useFlashcardStore';
import { useDailyGoalStore } from './stores/useDailyGoalStore';
import { useStudyStore } from './stores/useStudyStore';
import { useRedacaoStore } from './stores/useRedacaoStore';
import { usePlanejamento } from './stores/usePlanejamento';
import { useAuthStore } from './stores/useAuthStore';
import { useSubscriptionStore } from './stores/useSubscriptionStore';
import { useFriendsStore } from './stores/useFriendsStore';
import MobileHeader from './components/MobileHeader';
import QuickStartTimerButton from './components/QuickStartTimerButton';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginPage } from './components/LoginPage';
import { ModalSkeleton } from './components/skeletons';
import { getLocalDateISO } from './utils/dateUtils';

// Helper para lazy load seguro
const safeLazy = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return lazy(() =>
    importFn()
      .then((module) => {
        // Verificar se o módulo tem um default export válido
        if (!module || !module.default) {
          throw new Error('Módulo não possui export default válido');
        }
        return module;
      })
      .catch((err) => {
        // Não logar o erro aqui para evitar problemas de conversão
        // Apenas retornar um componente de fallback seguro
        return {
          default: (() => (
            <div className="p-8 text-center">
              <p>Erro ao carregar componente. Por favor, recarregue a página.</p>
            </div>
          )) as T,
        };
      })
  );
};

// Lazy load modals for better code splitting
const EditalManagementModal = safeLazy(() => import('./components/EditalManagementModal'));
const ActivateDefaultEditalModal = safeLazy(() => import('./components/ActivateDefaultEditalModal'));
const RegisterEditalModal = safeLazy(() => import('./components/RegisterEditalModal'));
const SalvarSessaoModal = safeLazy(() => import('./components/SalvarSessaoModal'));
const AdicionarTopicoModal = safeLazy(() => import('./components/AdicionarTopicoModal'));
const CriarCicloModal = safeLazy(() => import('./components/CriarCicloModal'));
const GeradorPlanoModal = safeLazy(() => import('./components/GeradorPlanoModal'));
const CriarFlashcardModal = safeLazy(() => import('./components/CriarFlashcardModal'));
const AgendarRevisoesModal = safeLazy(() => import('./components/AgendarRevisoesModal'));
const ConfirmarAgendarRevisoesModal = safeLazy(() => import('./components/ConfirmarAgendarRevisoesModal'));

// Lazy load heavy components that are conditionally rendered
const CronometroInteligente = safeLazy(() => import('./components/CronometroInteligente'));
const CommandPalette = safeLazy(() => import('./components/CommandPalette'));
const KeyboardShortcutsHelp = safeLazy(() => import('./components/KeyboardShortcutsHelp'));
const NotificationsPanel = safeLazy(() => import('./components/NotificationsPanel'));

// Hook para buscar dados dos stores quando o edital ativo muda
const useEditalDataSync = () => {
  const { editalAtivo } = useEditalStore();
  const { fetchDisciplinas } = useDisciplinasStore();
  const { fetchRevisoes } = useRevisoesStore();
  const { fetchErros } = useCadernoErrosStore();
  const { fetchSessoes, fetchTrilhas } = useEstudosStore();
  const { fetchCiclos } = useCiclosStore();
  const { fetchRedacoes } = useRedacaoStore();
  const { fetchSimulados } = useStudyStore();

  useEffect(() => {
    if (editalAtivo?.id) {
      console.log(`Buscando dados essenciais para o plano de estudo: ${editalAtivo.nome}`);
      Promise.all([
        fetchDisciplinas(editalAtivo.id),
        fetchRevisoes(editalAtivo.id),
        // fetchErros(editalAtivo.id), // Removido do load inicial (carregar na página de erros)
        fetchSessoes(editalAtivo.id, 300), // Limitado a 300 sessões para performance
        fetchCiclos(editalAtivo.id),
        // fetchRedacoes(editalAtivo.id), // Removido do load inicial
        // fetchSimulados(editalAtivo.id), // Removido do load inicial
        fetchTrilhas(editalAtivo.id), // Necessário para o planejamento semanal no dashboard
      ]).catch(err => {
        console.error("Falha ao buscar dados do plano de estudo", err);
        toast.error("Não foi possível carregar os dados do plano de estudo.");
      });
    }
  }, [editalAtivo?.id]);
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

// Hook to fetch subscription data
const useSubscriptionDataSync = () => {
  const { user } = useAuthStore();
  const { fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (user?.id) {
      fetchSubscription();
    }
  }, [user?.id, fetchSubscription]);
}


const Header: React.FC<{ theme: Theme; toggleTheme: () => void; activeView: string; setActiveView: (view: string) => void; }> = ({ theme, toggleTheme, activeView, setActiveView }) => {
  const openEstudoModal = useEstudosStore(state => state.iniciarSessaoInteligente);
  const user = useAuthStore(state => state.user);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const { revisoes } = useRevisoesStore();
  const { goalMinutes } = useDailyGoalStore();
  const { sessoes } = useEstudosStore();
  const { editalAtivo } = useEditalStore();

  // Calcular se há notificações para mostrar o indicador
  const hasNotifications = React.useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeISO = getLocalDateISO(hoje);

    // Revisões pendentes ou atrasadas
    const revisoesPendentes = revisoes.filter(r => {
      const dataPrevista = new Date(r.data_prevista);
      dataPrevista.setHours(0, 0, 0, 0);
      return (r.status === 'pendente' || r.status === 'atrasada') && dataPrevista <= hoje;
    });

    if (revisoesPendentes.length > 0) return true;

    // Meta diária não atingida
    const sessoesDeHoje = sessoes.filter(s => s.data_estudo === hojeISO);
    const tempoTotalSegundos = sessoesDeHoje.reduce((acc, s) => acc + s.tempo_estudado, 0);
    const tempoTotalMinutos = Math.round(tempoTotalSegundos / 60);
    const metaPercentual = goalMinutes > 0 ? Math.round((tempoTotalMinutos / goalMinutes) * 100) : 0;

    if (metaPercentual < 50 || tempoTotalMinutos === 0) return true;

    // Sem edital ativo
    if (!editalAtivo) return true;

    return false;
  }, [revisoes, goalMinutes, sessoes, editalAtivo]);

  return (
    <>
      <header data-tutorial="header" className="sticky top-0 z-30 hidden lg:flex items-center justify-between h-[73px] px-6 border-b border-white/10 bg-card/50 backdrop-blur-lg flex-shrink-0">
        <Breadcrumb activeView={activeView} setActiveView={setActiveView} />
        <div className="flex items-center gap-2">
          <button onClick={openEstudoModal} className="h-9 px-4 flex items-center gap-2 rounded-lg bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
            <PlusCircleIcon className="w-4 h-4" />
            Registrar estudo
          </button>

          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-black/20 text-muted-foreground hover:bg-black/30 transition-colors"
            aria-label="Notificações"
          >
            <BellIcon className="w-5 h-5" />
            {hasNotifications && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
              </>
            )}
          </button>

          <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />

          {user && (
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user.name.split(' ')[0]}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-black flex items-center justify-center rounded-full font-bold text-lg">
                {user.name.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </header>
      <Suspense fallback={null}>
        <NotificationsPanel
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          setActiveView={setActiveView}
        />
      </Suspense>
    </>
  );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    // Carregar estado do localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isKeyboardHelpOpen, setIsKeyboardHelpOpen] = useState(false);
  const editalAtivo = useEditalStore(state => state.editalAtivo);
  const { closeAllModals } = useModalStore();

  // Usar hook de navegação para obter view atual e função de navegação
  const { currentView, setActiveView } = useNavigation();

  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { fetchEditais } = useEditalStore();

  // Listener para abrir Command Palette com Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl/Cmd + / para mostrar ajuda
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsKeyboardHelpOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Usar hook de atalhos de teclado
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onCloseModals: () => {
      closeAllModals();
      setIsSidebarOpen(false);
      setIsCommandPaletteOpen(false);
      setIsKeyboardHelpOpen(false);
    },
    onToggleSidebar: () => setIsSidebarOpen(prev => !prev),
    isSidebarOpen,
  });

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
        await Promise.all([
          fetchEditais(),
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error || 'Erro desconhecido');
        console.error("Failed to load initial data:", errorMessage);
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
  useFriendsDataSync();
  useSubscriptionDataSync();

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

  // Persistir estado da sidebar colapsada
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);

  // Auto-expandir sidebar quando abrir em mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      setIsSidebarCollapsed(false);
    }
  }, [isSidebarOpen]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');

    if (themeToggleTimeout.current) {
      clearTimeout(themeToggleTimeout.current);
    }
    themeToggleCount.current++;

    if (themeToggleCount.current >= 5) {
      themeToggleCount.current = 0;
    }

    themeToggleTimeout.current = window.setTimeout(() => {
      themeToggleCount.current = 0;
    }, 3000); // Reset after 3 seconds of inactivity
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
    return <LoginPage />;
  }

  return (
    <ErrorBoundary>
      <BreadcrumbProvider>
        <div className="flex h-screen bg-background text-foreground font-sans dark overflow-hidden">
          <Toaster />

          {/* Lazy-loaded modals wrapped in Suspense */}
          <Suspense fallback={<ModalSkeleton />}>
            <CommandPalette open={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
          </Suspense>

          <Suspense fallback={<ModalSkeleton />}>
            <KeyboardShortcutsHelp open={isKeyboardHelpOpen} onOpenChange={setIsKeyboardHelpOpen} />
          </Suspense>

          <Suspense fallback={<ModalSkeleton />}>
            <SalvarSessaoModal />
            <EditalManagementModal />
            <ActivateDefaultEditalModal />
            <RegisterEditalModal />
            <AdicionarTopicoModal />
            <CriarCicloModal />
            <GeradorPlanoModal />
            <CriarFlashcardModal />
            <AgendarRevisoesModal />
            <ConfirmarAgendarRevisoesModal />
          </Suspense>

          <Sidebar
            activeView={currentView}
            setActiveView={setActiveView}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          />

          <div className="flex-1 flex flex-col min-w-0 relative">
            <div className="absolute left-0 right-0 top-0 min-h-[40px] px-4 py-2 bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs sm:text-sm font-bold text-black shadow-lg z-20">
              <span className="text-center truncate max-w-full">
                Plano de Estudo Ativo: {editalAtivo?.nome || 'Nenhum plano selecionado'} ({editalAtivo?.data_alvo.split('-')[0] || ''})
              </span>
            </div>
            <div className="flex-1 flex flex-col pt-[40px] min-h-0">
              <Header theme={theme} toggleTheme={toggleTheme} activeView={currentView} setActiveView={setActiveView} />
              <MobileHeader onOpenSidebar={() => setIsSidebarOpen(true)} theme={theme} toggleTheme={toggleTheme} />

              <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 relative min-h-0">
                <div className="max-w-7xl mx-auto w-full">
                  <ErrorBoundary>
                    <AppRoutes setActiveView={setActiveView} theme={theme} toggleTheme={toggleTheme} />
                  </ErrorBoundary>
                </div>

                <QuickStartTimerButton />
                <Suspense fallback={null}>
                  <CronometroInteligente />
                </Suspense>
              </main>
            </div>
          </div>
        </div>
      </BreadcrumbProvider>
    </ErrorBoundary>
  );
};

export default App;
