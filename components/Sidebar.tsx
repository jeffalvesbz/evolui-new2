import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  TrophyIcon,
} from './icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; restricted?: boolean; premiumOnly?: boolean }> = ({ icon, label, isActive, onClick, restricted, premiumOnly }) => {
  const { planType } = useSubscriptionStore();
  const isFree = planType === 'free';
  const showBadge = restricted && !isFree;
  const showLock = restricted && isFree;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 relative text-sm group ${isActive
        ? 'bg-primary/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)] border border-primary/20'
        : 'text-muted-foreground hover:bg-white/5 hover:text-white hover:translate-x-1'
        }`}
    >
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
      )}
      <div className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-primary' : 'group-hover:text-white'}`}>{icon}</div>
      <span className={`flex-1 text-left font-medium ${isActive ? 'text-white' : ''}`}>{label}</span>
      {showBadge && (
        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${premiumOnly
          ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_10px_rgba(139,92,246,0.2)]'
          : 'bg-secondary/10 border-secondary/20 text-secondary shadow-[0_0_10px_rgba(6,182,212,0.2)]'
          }`}>
          {premiumOnly ? 'PREMIUM' : 'PRO'}
        </div>
      )}
      {showLock && (
        <div className="bg-white/5 p-1.5 rounded-full backdrop-blur-sm" title="Recurso Premium">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
      )}
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const { canAccessPlanning, canAccessTimer, canAccessOCR, planType } = useSubscriptionStore();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGridIcon /> },
    { id: 'edital', label: 'Edital', icon: <LandmarkIcon /> },
    {
      id: 'planejamento',
      label: 'Planejamento',
      icon: <ClipboardListIcon />,
      restricted: !canAccessPlanning()
    },
    { id: 'ciclos', label: 'Ciclos de Estudos', icon: <RepeatIcon /> },
    {
      id: 'corretor',
      label: 'Corretor de Redação',
      icon: <PencilRulerIcon />,
      restricted: !canAccessOCR(),
      premiumOnly: true
    },
    { id: 'flashcards', label: 'Flashcards', icon: <LayersIcon /> },
    { id: 'quiz', label: 'Quiz', icon: <TrophyIcon /> },
    { id: 'revisoes', label: 'Revisões', icon: <CalendarClockIcon /> },
    { id: 'simulados', label: 'Simulados', icon: <FileTextIcon /> },
    { id: 'estatisticas', label: 'Estatísticas', icon: <BarChart3Icon /> },
    { id: 'historico', label: 'Histórico', icon: <HistoryIcon /> },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside data-tutorial="sidebar" className={`w-72 bg-[#0B0F19]/80 backdrop-blur-xl border-r border-white/5 flex-shrink-0 flex flex-col fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center space-x-4 p-6 h-[88px] border-b border-white/5 flex-shrink-0">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary-dark text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold text-2xl shadow-lg">E</div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide font-display">EVOLUI</h1>
            <p className="text-[10px] text-primary font-medium tracking-widest uppercase">Plataforma de Estudos</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              restricted={item.restricted}
              premiumOnly={item.premiumOnly}
              onClick={() => {
                setActiveView(item.id);
                onClose();
              }}
            />
          ))}
        </nav>

        {user && (
          <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
            {/* Upgrade Button */}
            {planType !== 'premium' && (
              <button
                onClick={() => {
                  setActiveView('pagamento');
                  onClose();
                }}
                className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 group border border-white/10"
              >
                <TrophyIcon className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                <span className="font-display tracking-wide">FAZER UPGRADE</span>
              </button>
            )}

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 space-y-1">
              <p className="font-semibold text-sm text-white truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveView('configuracoes');
                  onClose();
                }}
                className="flex-1 flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 group"
              >
                <span className="font-medium text-sm text-muted-foreground group-hover:text-white transition-colors">Configurações</span>
                <SettingsIcon className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </button>
              <button onClick={logout} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/10 hover:border-red-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

