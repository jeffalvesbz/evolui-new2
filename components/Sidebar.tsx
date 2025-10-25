import React from 'react';
import {
  LayoutGridIcon,
  ClipboardListIcon,
  RepeatIcon,
  LandmarkIcon,
  BarChart3Icon,
  LayersIcon,
  BookCopyIcon,
  HistoryIcon,
  FileTextIcon,
  CalendarClockIcon,
  SettingsIcon,
  PencilRulerIcon,
} from './icons';
import { mockUser } from '../data/mockData';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-lg transition-all duration-200 relative text-sm ${
        isActive
          ? 'bg-gradient-to-r from-primary/10 to-transparent text-foreground font-semibold shadow-lg shadow-primary/10'
          : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
      }`}
    >
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 bg-gradient-to-b from-primary to-secondary rounded-r-full"></div>}
      <div className="w-5 h-5">{icon}</div>
      <span className="flex-1 text-left">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGridIcon /> },
    { id: 'planejamento', label: 'Planejamento', icon: <ClipboardListIcon /> },
    { id: 'ciclos', label: 'Ciclos de Estudos', icon: <RepeatIcon /> },
    { id: 'edital', label: 'Edital', icon: <LandmarkIcon /> },
    { id: 'estatisticas', label: 'Estatísticas', icon: <BarChart3Icon /> },
    { id: 'flashcards', label: 'Flashcards', icon: <LayersIcon /> },
    { id: 'revisoes', label: 'Revisões', icon: <CalendarClockIcon /> },
    { id: 'erros', label: 'Caderno de Erros', icon: <BookCopyIcon /> },
    { id: 'historico', label: 'Histórico', icon: <HistoryIcon /> },
    { id: 'simulados', label: 'Simulados', icon: <FileTextIcon /> },
    { id: 'corretor', label: 'Corretor de Redação', icon: <PencilRulerIcon /> },
  ];

  return (
    <aside className="w-64 bg-card/40 backdrop-blur-xl border-r border-white/10 flex-shrink-0 hidden lg:flex flex-col">
      <div className="flex items-center space-x-3 p-5 h-[73px] border-b border-white/10 flex-shrink-0">
        <div className="bg-gradient-to-br from-primary to-secondary text-black w-10 h-10 flex items-center justify-center rounded-lg font-bold text-2xl shadow-lg shadow-primary/20">E</div>
        <div>
            <h1 className="text-base font-bold text-foreground tracking-wider">EVOLUI</h1>
        </div>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map(item => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </nav>
      <div className="p-4 border-t border-white/10 space-y-4">
        <div className="p-3 bg-black/20 rounded-lg">
            <p className="font-semibold text-sm text-foreground">{mockUser.name}</p>
            <p className="text-xs text-muted-foreground">{mockUser.status}</p>
        </div>
        <button className="w-full flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
            <span className="font-semibold text-sm text-foreground">Configurações</span>
            <SettingsIcon className="w-4 h-4 text-muted-foreground"/>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;