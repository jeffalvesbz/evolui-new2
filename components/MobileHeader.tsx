import React from 'react';
import { MenuIcon, PlayCircleIcon } from './icons';
import ThemeSwitcher from './ThemeSwitcher';
import { Theme } from '../types';
import { useEstudosStore } from '../stores/useEstudosStore';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar, theme, toggleTheme }) => {
  const iniciarSessaoInteligente = useEstudosStore((state) => state.iniciarSessaoInteligente);

  return (
    <header
      className="sticky top-0 z-30 flex lg:hidden items-center justify-between min-h-[60px] px-4 border-b border-white/10 bg-card/60 backdrop-blur-lg"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center min-w-0">
        <button onClick={onOpenSidebar} className="p-2 -ml-2 text-muted-foreground" aria-label="Abrir menu">
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3 ml-4">
          <div className="bg-gradient-to-br from-primary to-secondary text-black w-9 h-9 flex items-center justify-center rounded-lg font-bold text-xl shadow-md shadow-primary/20">
            E
          </div>
          <h1 className="text-sm font-bold text-foreground tracking-wider">EVOLUI</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={iniciarSessaoInteligente}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-sm font-semibold text-black shadow-lg shadow-primary/25 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <PlayCircleIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Registrar</span>
          <span className="sm:hidden">Iniciar</span>
        </button>
        <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};

export default MobileHeader;