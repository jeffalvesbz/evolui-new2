import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Mapeamento de rotas para views
const routeToViewMap: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/planejamento': 'planejamento',
  '/ciclos': 'ciclos',
  '/edital': 'edital',
  '/estatisticas': 'estatisticas',
  '/flashcards': 'flashcards',
  '/revisoes': 'revisoes',
  '/erros': 'erros',
  '/historico': 'historico',
  '/simulados': 'simulados',
  '/corretor': 'corretor',
  '/configuracoes': 'configuracoes',
};

const viewToRouteMap: Record<string, string> = {
  'dashboard': '/dashboard',
  'planejamento': '/planejamento',
  'ciclos': '/ciclos',
  'edital': '/edital',
  'estatisticas': '/estatisticas',
  'flashcards': '/flashcards',
  'revisoes': '/revisoes',
  'erros': '/erros',
  'historico': '/historico',
  'simulados': '/simulados',
  'corretor': '/corretor',
  'configuracoes': '/configuracoes',
};

// Função para converter pathname em view
export const getViewFromPath = (pathname: string): string => {
  return routeToViewMap[pathname] || 'dashboard';
};

// Função para converter view em rota
export const getRouteFromView = (view: string): string => {
  return viewToRouteMap[view] || '/dashboard';
};

// Lazy load de componentes para code splitting
const Dashboard = lazy(() => import('../components/Dashboard'));
const CicloDeEstudos = lazy(() => import('../components/CicloDeEstudos'));
const TrilhaSemanal = lazy(() => import('../components/TrilhaSemanal'));
const HistoricoPage = lazy(() => import('../components/HistoricoPage'));
const Edital = lazy(() => import('../components/Edital').catch(() => {
  // Fallback em caso de erro no carregamento
  return { default: () => <div>Erro ao carregar Edital</div> };
}));
const FlashcardsPage = lazy(() => import('../components/FlashcardsPage'));
const Simulados = lazy(() => import('../components/Simulados'));
const RevisoesPage = lazy(() => import('../components/RevisoesPage'));
const CadernoErros = lazy(() => import('../components/CadernoErros'));
const Estatisticas = lazy(() => import('../components/Estatisticas'));
const CorretorRedacao = lazy(() => import('../components/CorretorRedacao'));
const Configuracoes = lazy(() => import('../components/Configuracoes'));

// Componente de loading para Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

interface AppRoutesProps {
  setActiveView: (view: string) => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ setActiveView, theme = 'dark', toggleTheme = () => {} }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard setActiveView={setActiveView} />} />
        <Route path="/planejamento" element={<TrilhaSemanal />} />
        <Route path="/ciclos" element={<CicloDeEstudos />} />
        <Route path="/historico" element={<HistoricoPage setActiveView={setActiveView} />} />
        <Route path="/edital" element={<Edital />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/simulados" element={<Simulados />} />
        <Route path="/revisoes" element={<RevisoesPage />} />
        <Route path="/erros" element={<CadernoErros />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
        <Route path="/corretor" element={<CorretorRedacao />} />
        <Route path="/configuracoes" element={<Configuracoes theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
