import { useEffect, useRef } from 'react';

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
  const {
    onOpenCommandPalette,
    onCloseModals,
    onToggleSidebar,
    isSidebarOpen,
  } = options;

  // Usar useRef para estabilizar valores dinâmicos e evitar mudança de tamanho no array de dependências
  const onOpenCommandPaletteRef = useRef(onOpenCommandPalette);
  const onCloseModalsRef = useRef(onCloseModals);
  const onToggleSidebarRef = useRef(onToggleSidebar);

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
  }, []); // Array de dependências vazio - não precisa mais de setActiveView
};
