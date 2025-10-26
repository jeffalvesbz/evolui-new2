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
import { login } from './services/geminiService';
import { useAuthStore } from './stores/useAuthStore';

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
    // Adicionar fetch para outros stores aqui (flashcards, etc.)

    useEffect(() => {
        if (editalAtivo?.id) {
            console.log(`Buscando todos os dados para o edital: ${editalAtivo.nome}`);
            // Dispara todas as buscas de dados em paralelo
            Promise.all([
                fetchDisciplinas(editalAtivo.id),
                fetchRevisoes(editalAtivo.id),
                fetchErros(editalAtivo.id),
                fetchSessoes(editalAtivo.id),
                fetchCiclos(editalAtivo.id),
                fetchRedacoes(editalAtivo.id),
                fetchSimulados(editalAtivo.id),
            ]).catch(err => {
                console.error("Falha ao buscar dados do edital", err);
                toast.error("Não foi possível carregar os dados do edital.");
            });
        }
    }, [editalAtivo?.id]); // Depende apenas do ID do edital ativo
};

const Header: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void; activeView: string; }> = ({ theme, setTheme, activeView }) => {
  const openEstudoModal = useEstudosStore(state => state.iniciarSessaoInteligente);
  const user = useAuthStore(state => state.user);
  
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[73px] px-6 border-b border-white/10 bg-card/50 backdrop-blur-lg flex-shrink-0">
       <Breadcrumb activeView={activeView} setActiveView={() => {}} />
      <div className="flex items-center gap-2">
          <button onClick={openEstudoModal} className="h-9 px-4 flex items-center gap-2 rounded-lg bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity">
            <PlusCircleIcon className="w-4 h-4" />
            Registrar estudo
          </button>
          
          <button className="relative h-9 w-9 flex items-center justify-center rounded-lg bg-black/20 text-muted-foreground hover:bg-black/30 transition-colors">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
          </button>
          
          <ThemeSwitcher theme={theme} setTheme={setTheme} /> 
          
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

const AuthGate: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
    const { login } = useAuthStore();
    const [email, setEmail] = useState('test@evolui.app');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
            onLoginSuccess();
        } catch (err: any) {
            setError(err.message || 'Falha no login. Verifique suas credenciais.');
            toast.error(err.message || 'Falha no login.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-sm p-8 space-y-6 glass-card rounded-2xl">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground">Bem-vindo ao Evolui</h1>
                    <p className="text-muted-foreground mt-2">Faça login para continuar</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-4">
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
                        {loading ? 'Entrando...' : 'Entrar'}
                     </button>
                </form>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeView, setActiveView] = useState('dashboard'); 
  const { iniciarSessao, sessoes } = useEstudosStore();
  const editalAtivo = useEditalStore(state => state.editalAtivo);
  const { disciplinas } = useDisciplinasStore();
  const sessaoAtual = useEstudosStore(state => state.sessaoAtual);
  
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { fetchEditais } = useEditalStore();

  useEditalDataSync();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
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
        loadInitialData();
    }
  }, [isAuthenticated, fetchEditais]);

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
      default: return <Dashboard setActiveView={setActiveView} />;
    }
  };

  const { getCicloAtivo } = useCiclosStore();

  const handleStartNextStudy = () => {
    const cicloAtivo = getCicloAtivo();
    if (!cicloAtivo || cicloAtivo.sessoes.length === 0) {
        toast.error("Nenhum ciclo ativo ou sessões configuradas.");
        return;
    }
    // Lógica complexa de encontrar a próxima sessão pode ser movida para o backend no futuro
    const nextSession = cicloAtivo.sessoes[0]; // Simplificado por agora
    if (nextSession) {
        const disciplina = disciplinas.find(d => d.id === nextSession.disciplina_id);
        if (disciplina) {
            iniciarSessao({ id: `ciclo-${nextSession.id}`, nome: disciplina.nome, disciplinaId: disciplina.id });
            toast.success(`Iniciando estudos de ${disciplina.nome}!`);
        }
    }
  };
  
  if (!isAuthenticated) {
    return <AuthGate onLoginSuccess={checkAuth} />;
  }
  
  if (isAppLoading) {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-background text-foreground">
            <LandmarkIcon className="w-16 h-16 text-primary animate-pulse mb-4" />
            <h2 className="text-2xl font-bold">Carregando seus dados...</h2>
            <p className="text-muted-foreground">Aguarde um momento.</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans dark overflow-hidden">
      <Toaster />
      <SalvarSessaoModal />
      <EditalManagementModal />
      <AdicionarTopicoModal />
      <CriarCicloModal />
      
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex flex-col flex-1 w-full">
        <div className="w-full h-8 bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-xs font-bold text-black shadow-lg z-20">
            Edital ativo: {editalAtivo?.nome || 'Nenhum edital selecionado'} ({editalAtivo?.data_alvo.split('-')[0] || ''})
        </div>
        <Header theme={theme} setTheme={setTheme} activeView={activeView} />
        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
          
          {!sessaoAtual && (
            <button 
              onClick={handleStartNextStudy}
              className="fixed bottom-6 right-6 h-14 w-14 flex items-center justify-center rounded-full bg-gradient-to-tr from-primary to-secondary text-black shadow-lg shadow-primary/30 hover:opacity-90 transition-all transform hover:scale-110 z-40">
              <PlayCircleIcon className="w-7 h-7" />
            </button>
          )}

          <CronometroInteligente />
        </main>
      </div>
    </div>
  );
};

export default App;
