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



interface SidebarProps {

  activeView: string;

  setActiveView: (view: string) => void;

  isOpen: boolean;

  onClose: () => void;

}



const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (

  <button

    onClick={onClick}

    className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-lg transition-all duration-200 relative text-sm ${isActive

      ? 'bg-gradient-to-r from-primary/10 to-transparent text-foreground font-semibold shadow-lg shadow-primary/10'

      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'

      }`}

  >

    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 bg-gradient-to-b from-primary to-secondary rounded-r-full"></div>}

    <div className="w-5 h-5">{icon}</div>

    <span className="flex-1 text-left">{label}</span>

  </button>

);



const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose }) => {

  const { user, logout } = useAuthStore();

  const navItems = [

    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGridIcon /> },

    { id: 'edital', label: 'Edital', icon: <LandmarkIcon /> },

    { id: 'planejamento', label: 'Planejamento', icon: <ClipboardListIcon /> },

    { id: 'ciclos', label: 'Ciclos de Estudos', icon: <RepeatIcon /> },

    { id: 'corretor', label: 'Corretor de Redação', icon: <PencilRulerIcon /> },

    { id: 'flashcards', label: 'Flashcards', icon: <LayersIcon /> },

    { id: 'erros', label: 'Caderno de Erros', icon: <BookCopyIcon /> },

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

            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30 lg:hidden"

          />

        )}

      </AnimatePresence>

      <aside data-tutorial="sidebar" className={`w-64 bg-card/40 backdrop-blur-xl border-r border-white/10 flex-shrink-0 flex flex-col fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out lg:sticky lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>

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

              onClick={() => {

                setActiveView(item.id);

                onClose();

              }}

            />

          ))}

        </nav>

        {user && (

          <div className="p-4 border-t border-white/10 space-y-4">

            <div className="p-3 bg-muted/30 rounded-lg space-y-2">

              <p className="font-semibold text-sm text-foreground">{user.name}</p>

              <p className="text-xs text-muted-foreground">{user.email}</p>

            </div>

            <div className="flex items-center gap-2">

              <button
                onClick={() => {
                  setActiveView('configuracoes');
                  onClose();
                }}
                className="flex-1 flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="font-semibold text-sm text-foreground">Configurações</span>
                <SettingsIcon className="w-4 h-4 text-muted-foreground" />
              </button>

              <button onClick={logout} className="p-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-semibold text-sm">

                Sair

              </button>

            </div>

          </div>

        )}

      </aside>

    </>

  );

};



export default Sidebar;

