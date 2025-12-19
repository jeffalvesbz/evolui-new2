import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedAdminRoute } from '../components/ProtectedAdminRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import { DashboardSkeleton } from '../components/skeletons';
import { LoginPage } from '../components/LoginPage';
import { LandingPage } from '../components/LandingPage';

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
  '/pagamento': 'pagamento',
  '/quiz': 'quiz',
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
  'pagamento': '/pagamento',
  'quiz': '/quiz',
};

// Função para converter pathname em view
export const getViewFromPath = (pathname: string): string => {
  return routeToViewMap[pathname] || 'dashboard';
};

// Função para converter view em rota
export const getRouteFromView = (view: string): string => {
  return viewToRouteMap[view] || '/dashboard';
};

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

// Lazy load de componentes para code splitting
const Dashboard = safeLazy(() => import('../components/Dashboard'));
const CicloDeEstudos = safeLazy(() => import('../components/CicloDeEstudos'));
const TrilhaSemanal = safeLazy(() => import('../components/TrilhaSemanal'));
const HistoricoPage = safeLazy(() => import('../components/HistoricoPage'));
const Edital = safeLazy(() => import('../components/Edital'));
const FlashcardsPage = safeLazy(() => import('../components/FlashcardsPage'));
const Simulados = safeLazy(() => import('../components/Simulados'));
const RevisoesPage = safeLazy(() => import('../components/RevisoesPage'));
const CadernoErros = safeLazy(() => import('../components/CadernoErros'));
const Estatisticas = safeLazy(() => import('../components/Estatisticas'));
const CorretorRedacao = safeLazy(() => import('../components/CorretorRedacao'));
const Configuracoes = safeLazy(() => import('../components/Configuracoes'));
const PaymentPage = safeLazy(() => import('../components/PaymentPageStripe'));

// Admin Pages
const AdminEditaisList = safeLazy(() => import('../src/pages/admin/editais/index'));
const AdminEditalNovo = safeLazy(() => import('../src/pages/admin/editais/novo'));
const AdminEditalDetalhes = safeLazy(() => import('../src/pages/admin/editais/[id]'));
const AdminDisciplinaDetalhes = safeLazy(() => import('../src/pages/admin/editais/[id]/disciplina/[disciplinaId]'));
const AdminSolicitacoesEditais = safeLazy(() => import('../src/pages/admin/editais/solicitacoes'));

// Admin Flashcards Pages
const AdminFlashcardsList = safeLazy(() => import('../src/pages/admin/flashcards/index'));
const AdminFlashcardsNovo = safeLazy(() => import('../src/pages/admin/flashcards/novo'));
const AdminFlashcardsEdit = safeLazy(() => import('../src/pages/admin/flashcards/[id]'));

// User Pages
const UserEditaisDashboard = safeLazy(() => import('../src/pages/dashboard/editais'));
const MinhasSolicitacoes = safeLazy(() => import('../src/pages/dashboard/minhas-solicitacoes'));
const QuizPage = safeLazy(() => import('../src/pages/QuizPage'));

interface AppRoutesProps {
  setActiveView: (view: string) => void;
  theme?: 'light' | 'dark';
  toggleTheme?: () => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({ setActiveView, theme = 'dark', toggleTheme = () => { } }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard setActiveView={setActiveView} />
            </Suspense>
          }
        />
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

        {/* Admin Routes - Protegidas */}
        <Route path="/admin/editais" element={<ProtectedAdminRoute><AdminEditaisList /></ProtectedAdminRoute>} />
        <Route path="/admin/editais/novo" element={<ProtectedAdminRoute><AdminEditalNovo /></ProtectedAdminRoute>} />
        <Route path="/admin/editais/solicitacoes" element={<ProtectedAdminRoute><AdminSolicitacoesEditais /></ProtectedAdminRoute>} />
        <Route path="/admin/editais/:id" element={<ProtectedAdminRoute><AdminEditalDetalhes /></ProtectedAdminRoute>} />
        <Route path="/admin/editais/:id/disciplina/:disciplinaId" element={<ProtectedAdminRoute><AdminDisciplinaDetalhes /></ProtectedAdminRoute>} />

        {/* Admin Flashcards Routes */}
        <Route path="/admin/flashcards" element={<ProtectedAdminRoute><AdminFlashcardsList /></ProtectedAdminRoute>} />
        <Route path="/admin/flashcards/novo" element={<ProtectedAdminRoute><AdminFlashcardsNovo /></ProtectedAdminRoute>} />
        <Route path="/admin/flashcards/:id" element={<ProtectedAdminRoute><AdminFlashcardsEdit /></ProtectedAdminRoute>} />

        {/* User Dashboard Routes */}
        <Route path="/dashboard/editais" element={<UserEditaisDashboard />} />
        <Route path="/dashboard/minhas-solicitacoes" element={<MinhasSolicitacoes />} />

        {/* Payment Route */}
        <Route path="/pagamento" element={<PaymentPage />} />

        {/* Quiz Route */}
        <Route path="/quiz" element={<QuizPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
