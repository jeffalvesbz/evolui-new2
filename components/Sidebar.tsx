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
  MenuIcon,
  LockIcon,
  MessageCircleIcon,
} from './icons';
import { useAuthStore } from '../stores/useAuthStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; restricted?: boolean; premiumOnly?: boolean; isCollapsed?: boolean }> = ({ icon, label, isActive, onClick, restricted, premiumOnly, isCollapsed }) => {
  const { planType } = useSubscriptionStore();
  const isFree = planType === 'free';
  const showBadge = restricted && !isFree;
  const showLock = restricted && isFree;

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3.5 px-4'} py-3.5 rounded-xl transition-all duration-200 ease-out relative text-sm ${isActive
          ? 'bg-primary/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)] border border-primary/20'
          : 'text-muted-foreground hover:bg-white/5 hover:text-white hover:translate-x-0.5'
          }`}
        aria-label={label}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-primary to-secondary rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
        )}
        <div className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${isActive ? 'text-primary scale-110' : 'group-hover:text-white group-hover:scale-105'}`}>{icon}</div>
        {!isCollapsed && (
          <>
            <span className={`flex-1 text-left font-medium transition-colors duration-200 ${isActive ? 'text-white' : ''}`}>{label}</span>
            {showBadge && (
              <div className={`p-1 rounded-md transition-all duration-200 ${premiumOnly
                ? 'bg-primary/10 text-primary shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                : 'bg-secondary/10 text-secondary shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                }`} title={premiumOnly ? 'Exclusivo Premium' : 'Exclusivo Pro'}>
                <LockIcon className="w-3 h-3" />
              </div>
            )}
            {showLock && (
              <div className="bg-white/5 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200" title="Recurso Premium">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            )}
          </>
        )}
      </button>
      {isCollapsed && (
        <div className="absolute left-full ml-3 px-3 py-1.5 bg-card/95 backdrop-blur-sm border border-white/10 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-x-1 transition-all duration-200 z-50 pointer-events-none shadow-lg">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-card/95"></div>
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose, isCollapsed, onToggleCollapse }) => {
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
    { id: 'quiz', label: 'Questões com IA', icon: <TrophyIcon /> },
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

      <aside data-tutorial="sidebar" className={`${isCollapsed ? 'w-20' : 'w-72'} bg-[#0B0F19]/95 backdrop-blur-xl border-r border-white/5 flex-shrink-0 flex flex-col fixed top-0 left-0 h-full z-40 transition-all duration-300 ease-in-out lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl lg:shadow-none`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-3' : 'gap-4'} p-6 h-[88px] border-b border-white/5 flex-shrink-0 relative sticky top-0 z-10 bg-[#0B0F19]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)]`}>
          {!isCollapsed && (
            <>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all duration-200 group flex-shrink-0"
                aria-label="Recolher sidebar"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary-dark text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold text-2xl shadow-lg">E</div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-wide font-display">ELEVA</h1>
                <p className="text-[10px] text-primary font-medium tracking-widest uppercase">Plataforma de Estudos</p>
              </div>
            </>
          )}
          {isCollapsed && (
            <>
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all duration-200 group flex-shrink-0"
                aria-label="Expandir sidebar"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary-dark text-white w-10 h-10 flex items-center justify-center rounded-xl font-bold text-2xl shadow-lg">E</div>
              </div>
            </>
          )}
        </div>

        <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-6 space-y-1.5 overflow-x-hidden overflow-y-auto relative before:absolute before:top-0 before:left-0 before:right-0 before:h-6 before:bg-gradient-to-b before:from-[#0B0F19] before:to-transparent before:z-[1] before:pointer-events-none`}>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeView === item.id}
              restricted={item.restricted}
              premiumOnly={item.premiumOnly}
              isCollapsed={isCollapsed}
              onClick={() => {
                setActiveView(item.id);
                onClose();
              }}
            />
          ))}
        </nav>

        {user && (
          <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-white/5 space-y-4 bg-black/20`}>
            {/* Upgrade Button */}
            {!isCollapsed && planType !== 'premium' && (
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



            {/* Footer Buttons */}
            {!isCollapsed ? (
              <div className="space-y-2">
                {/* WhatsApp Support Button - Full Width */}
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 p-3 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition-colors border border-green-500/10 group"
                  title="Suporte via WhatsApp"
                >
                  <MessageCircleIcon className="w-4 h-4 text-green-400 group-hover:text-green-300 transition-colors" />
                  <span className="font-medium text-sm text-green-400 group-hover:text-green-300 transition-colors">Suporte via WhatsApp</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveView('configuracoes');
                      onClose();
                    }}
                    className="flex-1 flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 group"
                    title="Configurações"
                  >
                    <span className="font-medium text-sm text-muted-foreground group-hover:text-white transition-colors">Configurações</span>
                    <SettingsIcon className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                  </button>

                  <button onClick={logout} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/10 hover:border-red-500/20 flex-shrink-0" title="Sair">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Collapsed State */}
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition-colors border border-green-500/10 group flex items-center justify-center"
                  title="Suporte via WhatsApp"
                >
                  <MessageCircleIcon className="w-5 h-5 text-green-400 group-hover:text-green-300 transition-colors" />
                </a>

                <button
                  onClick={() => {
                    setActiveView('configuracoes');
                    onClose();
                  }}
                  className="w-full p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 group flex items-center justify-center"
                  title="Configurações"
                >
                  <SettingsIcon className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                </button>

                <button onClick={logout} className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors border border-red-500/10 hover:border-red-500/20 flex items-center justify-center w-full" title="Sair">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;

