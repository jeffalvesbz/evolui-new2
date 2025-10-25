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
import { BellIcon, PlusCircleIcon, PlayCircleIcon, SettingsIcon } from './components/icons';
import { Theme } from './types';
import { mockUser } from './data/mockData';
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

const useEditalDataSync = () => {
    const { editalAtivo } = useEditalStore();
    const { setEditalAtivo: setDisciplinasEdital } = useDisciplinasStore();
    const { setEditalAtivo: setRevisoesEdital } = useRevisoesStore();
    const { setEditalAtivo: setErrosEdital } = useCadernoErrosStore();
    const { setEditalAtivo: setEstudosEdital } = useEstudosStore();

    useEffect(() => {
        if (editalAtivo?.id) {
            console.log(`Sincronizando dados para o edital: ${editalAtivo.nome}`);
            setDisciplinasEdital(editalAtivo.id);
            setRevisoesEdital(editalAtivo.id);
            setErrosEdital(editalAtivo.id);
            setEstudosEdital(editalAtivo.id);
        }
    }, [editalAtivo, setDisciplinasEdital, setRevisoesEdital, setErrosEdital, setEstudosEdital]);
};

const Header: React.FC<{ theme: Theme; setTheme: (theme: Theme) => void; activeView: string; }> = ({ theme, setTheme, activeView }) => {
  const openEstudoModal = useEstudosStore(state => state.iniciarSessaoInteligente);
  
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
          
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{mockUser.name.split(' ')[0]}</p>
              <p className="text-xs text-muted-foreground">Estudante</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary text-black flex items-center justify-center rounded-full font-bold text-lg">
              {mockUser.avatarLetter}
            </div>
          </div>
      </div>
    </header>
  );
};


const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [activeView, setActiveView] = useState('dashboard'); 
  const { iniciarSessao, sessoes } = useEstudosStore();
  const editalAtivo = useEditalStore(state => state.editalAtivo);
  const { disciplinas } = useDisciplinasStore();
  const sessaoAtual = useEstudosStore(state => state.sessaoAtual);

  const hasHydrated = useEditalStore((s) => s._hasHydrated) &&
                      useDisciplinasStore((s) => s._hasHydrated) &&
                      useRevisoesStore((s) => s._hasHydrated) &&
                      useCadernoErrosStore((s) => s._hasHydrated) &&
                      useEstudosStore((s) => s._hasHydrated) &&
                      useCiclosStore((s) => s._hasHydrated) &&
                      useFlashcardsStore((s) => s._hasHydrated) &&
                      useDailyGoalStore((s) => s._hasHydrated) &&
                      useStudyStore((s) => s._hasHydrated) &&
                      useRedacaoStore((s) => s._hasHydrated) &&
                      usePlanejamento((s) => s._hasHydrated);


  // Ciclos store
  const { getCicloAtivo } = useCiclosStore();

  useEditalDataSync();

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
      case 'dashboard':
        return <Dashboard setActiveView={setActiveView} />;
      case 'planejamento':
        return <TrilhaSemanal />;
      case 'ciclos':
        return <CicloDeEstudos />;
      case 'historico':
        return <HistoricoPage setActiveView={setActiveView} />;
      case 'edital':
        return <Edital />;
      case 'flashcards':
        return <FlashcardsPage />;
      case 'simulados':
        return <Simulados />;
      case 'revisoes':
        return <RevisoesPage />;
      case 'erros':
        return <CadernoErros />;
      case 'estatisticas':
        return <Estatisticas />;
      case 'corretor':
        return <CorretorRedacao />;
      default:
        return <Dashboard setActiveView={setActiveView} />;
    }
  };

  const handleStartNextStudy = () => {
    const cicloAtivo = getCicloAtivo();
    if (!cicloAtivo || cicloAtivo.sessoes.length === 0) {
        toast.error("Nenhum ciclo ativo ou sessões configuradas.");
        return;
    }

    const studiedTimeBySession = sessoes.reduce((acc, session) => {
        if(session.topico_id.startsWith('ciclo-')) {
            const cicloSessaoId = session.topico_id.replace('ciclo-', '');
            acc[cicloSessaoId] = (acc[cicloSessaoId] || 0) + session.tempo_estudado;
        }
        return acc;
    }, {} as Record<string, number>);

    const nextSession = cicloAtivo.sessoes.find(sessao => {
        const studied = studiedTimeBySession[sessao.id] || 0;
        return studied < sessao.tempo_previsto;
    });

    if (nextSession) {
        const disciplina = disciplinas.find(d => d.id === nextSession.disciplina_id);
        if (disciplina) {
            iniciarSessao({
                id: `ciclo-${nextSession.id}`,
                nome: disciplina.nome,
                disciplinaId: disciplina.id
            });
            toast.success(`Iniciando estudos de ${disciplina.nome}!`);
        } else {
             toast.error("Disciplina da próxima sessão não encontrada.");
        }
    } else {
        toast.success("Parabéns! Você concluiu todas as sessões do ciclo.");
    }
  };

  if (!hasHydrated) {
    // Render a loading state or nothing until hydration is complete
    return null;
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