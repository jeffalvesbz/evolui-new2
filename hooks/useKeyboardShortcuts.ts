import { useEffect } from 'react';
import { useNavigation } from './useNavigation';

interface KeyboardShortcutsOptions {
  onOpenCommandPalette?: () => void;
  onCloseModals?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

/**
 * Hook para gerenciar atalhos de teclado globais
 */
export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const { setActiveView } = useNavigation();
  const {
    onOpenCommandPalette,
    onCloseModals,
    onToggleSidebar,
    isSidebarOpen,
  } = options;

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
          onCloseModals?.();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
          e.preventDefault();
          // Mostrar ajuda - será implementado
        }
        return;
      }

      // Números 1-9 para navegação rápida
      if (e.key >= '1' && e.key <= '9' && !e.metaKey && !e.ctrlKey && !e.altKey) {
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

      // ESC para fechar modais/sidebar
      if (e.key === 'Escape') {
        onCloseModals?.();
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
        onOpenCommandPalette?.();
      }

      // Ctrl/Cmd + B para toggle sidebar (opcional)
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        onToggleSidebar?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setActiveView, onOpenCommandPalette, onCloseModals, onToggleSidebar, isSidebarOpen]);
};

