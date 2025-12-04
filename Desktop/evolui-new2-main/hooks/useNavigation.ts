import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { getViewFromPath, getRouteFromView } from '../routes';
import { useNavigationStore } from '../stores/useNavigationStore';

/**
 * Hook customizado para gerenciar navegação mantendo compatibilidade com setActiveView
 */
export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToHistory, setLastVisitedView } = useNavigationStore();

  // Converter pathname atual para view
  const currentView = getViewFromPath(location.pathname);

  // Rastrear navegação no histórico
  useEffect(() => {
    if (currentView && currentView !== 'dashboard') {
      addToHistory(currentView);
      setLastVisitedView(currentView);
    }
  }, [currentView, addToHistory, setLastVisitedView]);

  // Função compatível com setActiveView
  const setActiveView = (view: string) => {
    const route = getRouteFromView(view);
    navigate(route);
  };

  // Função para navegar diretamente
  const navigateTo = (view: string) => {
    setActiveView(view);
  };

  return {
    currentView,
    setActiveView,
    navigateTo,
    navigate,
    location,
  };
};

