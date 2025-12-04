import { useEffect, useRef } from 'react';
<<<<<<< HEAD
=======
import { useNavigation } from './useNavigation';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

interface KeyboardShortcutsOptions {
  onOpenCommandPalette?: () => void;
  onCloseModals?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
<<<<<<< HEAD
=======
  disableNavigation?: boolean; // Para desabilitar navegação por números quando em flashcards
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
}

/**
 * Hook para gerenciar atalhos de teclado globais
 */
export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
<<<<<<< HEAD
=======
  const { setActiveView } = useNavigation();
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  const {
    onOpenCommandPalette,
    onCloseModals,
    onToggleSidebar,
    isSidebarOpen,
<<<<<<< HEAD
=======
    disableNavigation = false,
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  } = options;

  // Usar useRef para estabilizar valores dinâmicos e evitar mudança de tamanho no array de dependências
  const onOpenCommandPaletteRef = useRef(onOpenCommandPalette);
  const onCloseModalsRef = useRef(onCloseModals);
  const onToggleSidebarRef = useRef(onToggleSidebar);
<<<<<<< HEAD
=======
  const disableNavigationRef = useRef(disableNavigation);
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

  // Atualizar refs quando os valores mudarem
  useEffect(() => {
    onOpenCommandPaletteRef.current = onOpenCommandPalette;
  }, [onOpenCommandPalette]);

  useEffect(() => {
    onCloseModalsRef.current = onCloseModals;
  }, [onCloseModals]);

  useEffect(() => {
    onToggleSidebarRef.current = onToggleSidebar;
  }, [onToggleSidebar]);

<<<<<<< HEAD
=======
  useEffect(() => {
    disableNavigationRef.current = disableNavigation;
  }, [disableNavigation]);

>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  // Efeito principal com array de dependências fixo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar se estiver digitando em um input, textarea ou contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Permitir apenas ESC e Ctrl/Cmd + / mesmo em inputs
        if (e.key === 'Escape') {
          onCloseModalsRef.current?.();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          // Mostrar ajuda - será implementado
        }
        return;
      }

<<<<<<< HEAD
=======
      // Desabilitar navegação por números quando explicitamente desabilitado
      // (ex: quando há uma sessão de flashcards ativa)
      // Números 1-9 para navegação rápida (desabilitado quando disableNavigation é true)
      if (!disableNavigationRef.current && e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const pageMap: Record<string, string> = {
          '1': 'dashboard',
          '2': 'planejamento',
          '3': 'ciclos',
          '4': 'edital',
          '5': 'estatisticas',
          '6': 'gamificacao',
          '7': 'flashcards',
          '8': 'revisoes',
          '9': 'erros',
        };
        
        const view = pageMap[e.key];
        if (view) {
          e.preventDefault();
          setActiveView(view);
        }
      }

>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      // ESC para fechar modais/sidebar
      if (e.key === 'Escape') {
        onCloseModalsRef.current?.();
      }

      // / para focar busca (se implementada)
      // Por enquanto não faz nada, mas pode ser usado no futuro

      // Ctrl/Cmd + / para mostrar ajuda
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        // Será implementado com modal de ajuda
      }

      // Ctrl/Cmd + K para Command Palette (já gerenciado no App.tsx)
      // Mas podemos manter aqui como fallback
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        onOpenCommandPaletteRef.current?.();
      }

      // Ctrl/Cmd + B para toggle sidebar (opcional)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onToggleSidebarRef.current?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
<<<<<<< HEAD
  }, []); // Array de dependências vazio - não precisa mais de setActiveView
};
=======
  }, [setActiveView]); // Array de dependências fixo - apenas setActiveView (função estável do hook useNavigation)
};

>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
