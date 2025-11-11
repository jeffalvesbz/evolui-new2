import React from 'react';
import { MenuIcon } from './icons';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar }) => {
  return (
    <header className="sticky top-0 z-30 flex lg:hidden items-center h-[60px] px-4 border-b border-white/10 bg-card/50 backdrop-blur-lg">
      <button onClick={onOpenSidebar} className="p-2 -ml-2 text-muted-foreground" aria-label="Abrir menu">
        <MenuIcon className="w-6 h-6" />
      </button>
      <div className="flex items-center space-x-3 ml-4">
          <div className="bg-gradient-to-br from-primary to-secondary text-black w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xl shadow-md shadow-primary/20">E</div>
          <h1 className="text-sm font-bold text-foreground tracking-wider">EVOLUI</h1>
      </div>
    </header>
  );
};

export default MobileHeader;