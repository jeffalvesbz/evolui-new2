import React from 'react';
import { MenuIcon } from './icons';
import ThemeSwitcher from './ThemeSwitcher';
import { Theme } from '../types';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar, theme, toggleTheme }) => {
  return (
    <header className="sticky top-0 z-30 flex lg:hidden items-center justify-between h-[60px] px-4 border-b border-white/10 bg-card/50 backdrop-blur-lg">
      <div className="flex items-center">
        <button onClick={onOpenSidebar} className="p-2 -ml-2 text-muted-foreground" aria-label="Abrir menu">
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3 ml-4">
          <div className="bg-gradient-to-br from-primary to-secondary text-black w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xl shadow-md shadow-primary/20">E</div>
          <h1 className="text-sm font-bold text-foreground tracking-wider">ELEVA</h1>
        </div>
      </div>
      <ThemeSwitcher theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
};

export default MobileHeader;