import React, { useState, useEffect } from 'react';

import { Command } from 'cmdk';

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

  PencilRulerIcon,

  TrophyIcon,

  SearchIcon,

} from './icons';

import { useNavigation } from '../hooks/useNavigation';



interface CommandPaletteProps {

  open: boolean;

  onOpenChange: (open: boolean) => void;

}



interface CommandItem {

  id: string;

  label: string;

  icon: React.ReactNode;

  category: string;

  description?: string;

}



const commandItems: CommandItem[] = [

  // Planejamento

  { id: 'dashboard', label: 'Dashboard', icon: <LayoutGridIcon />, category: 'Planejamento', description: 'Visão geral do seu progresso' },

  { id: 'planejamento', label: 'Planejamento', icon: <ClipboardListIcon />, category: 'Planejamento', description: 'Trilha semanal de estudos' },

  { id: 'ciclos', label: 'Ciclos de Estudos', icon: <RepeatIcon />, category: 'Planejamento', description: 'Gerenciar ciclos de estudo' },

  { id: 'edital', label: 'Edital', icon: <LandmarkIcon />, category: 'Planejamento', description: 'Configurar edital e disciplinas' },



  // Estudo

  { id: 'flashcards', label: 'Flashcards', icon: <LayersIcon />, category: 'Estudo', description: 'Estudar com flashcards' },

  { id: 'revisoes', label: 'Revisões', icon: <CalendarClockIcon />, category: 'Estudo', description: 'Revisões agendadas' },

  { id: 'simulados', label: 'Simulados', icon: <FileTextIcon />, category: 'Estudo', description: 'Fazer simulados' },

  // { id: 'erros', label: 'Caderno de Erros', icon: <BookCopyIcon />, category: 'Estudo', description: 'Revisar erros cometidos' },



  // Análise

  { id: 'estatisticas', label: 'Estatísticas', icon: <BarChart3Icon />, category: 'Análise', description: 'Ver estatísticas detalhadas' },

  { id: 'historico', label: 'Histórico', icon: <HistoryIcon />, category: 'Análise', description: 'Histórico de sessões' },



  // Ferramentas

  { id: 'corretor', label: 'Corretor de Redação', icon: <PencilRulerIcon />, category: 'Ferramentas', description: 'Corrigir redações' },

];



const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {

  const { setActiveView } = useNavigation();

  const [search, setSearch] = useState('');



  // Fechar com ESC

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {

      if (e.key === 'Escape' && open) {

        onOpenChange(false);

      }

    };



    if (open) {

      document.addEventListener('keydown', handleKeyDown);

      document.body.style.overflow = 'hidden';

    } else {

      document.body.style.overflow = '';

    }



    return () => {

      document.removeEventListener('keydown', handleKeyDown);

      document.body.style.overflow = '';

    };

  }, [open, onOpenChange]);



  // Filtrar itens baseado na busca

  const filteredItems = commandItems.filter(item =>

    item.label.toLowerCase().includes(search.toLowerCase()) ||

    item.description?.toLowerCase().includes(search.toLowerCase()) ||

    item.category.toLowerCase().includes(search.toLowerCase())

  );



  // Agrupar por categoria

  const groupedItems = filteredItems.reduce((acc, item) => {

    if (!acc[item.category]) {

      acc[item.category] = [];

    }

    acc[item.category].push(item);

    return acc;

  }, {} as Record<string, CommandItem[]>);



  const handleSelect = (item: CommandItem) => {

    setActiveView(item.id);

    onOpenChange(false);

    setSearch('');

  };



  return (

    <AnimatePresence>

      {open && (

        <>

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            onClick={() => onOpenChange(false)}

            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"

          />

          <motion.div

            initial={{ opacity: 0, scale: 0.95, y: -20 }}

            animate={{ opacity: 1, scale: 1, y: 0 }}

            exit={{ opacity: 0, scale: 0.95, y: -20 }}

            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"

          >

            <Command className="bg-card border border-border rounded-lg shadow-2xl overflow-hidden">

              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">

                <SearchIcon className="w-5 h-5 text-muted-foreground" />

                <Command.Input

                  placeholder="Digite para buscar páginas..."

                  value={search}

                  onValueChange={setSearch}

                  className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"

                  autoFocus

                />

                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 rounded border border-white/10">

                  ESC

                </kbd>

              </div>



              <Command.List className="max-h-[400px] overflow-y-auto p-2">

                {filteredItems.length === 0 ? (

                  <Command.Empty className="py-8 text-center text-muted-foreground">

                    Nenhum resultado encontrado.

                  </Command.Empty>

                ) : (

                  Object.entries(groupedItems).map(([category, items]) => (

                    <div key={category}>

                      <Command.Group heading={category} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">

                        {items.map((item) => (

                          <Command.Item

                            key={item.id}

                            value={`${item.label} ${item.description || ''} ${category}`}

                            onSelect={() => handleSelect(item)}

                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-primary/10 aria-selected:bg-primary/20 aria-selected:text-foreground"

                          >

                            <div className="w-5 h-5 text-muted-foreground aria-selected:text-primary">

                              {item.icon}

                            </div>

                            <div className="flex-1">

                              <div className="font-medium text-sm">{item.label}</div>

                              {item.description && (

                                <div className="text-xs text-muted-foreground">{item.description}</div>

                              )}

                            </div>

                          </Command.Item>

                        ))}

                      </Command.Group>

                    </div>

                  ))

                )}

              </Command.List>



              <div className="px-4 py-2 border-t border-white/10 text-xs text-muted-foreground flex items-center justify-between">

                <span>Use ↑↓ para navegar, Enter para selecionar</span>

                <span>{filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''}</span>

              </div>

            </Command>

          </motion.div>

        </>

      )}

    </AnimatePresence>

  );

};



export default CommandPalette;



