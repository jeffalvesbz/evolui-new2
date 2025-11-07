import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from './icons';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navegação
  { keys: ['1'], description: 'Ir para Dashboard', category: 'Navegação' },
  { keys: ['2'], description: 'Ir para Planejamento', category: 'Navegação' },
  { keys: ['3'], description: 'Ir para Ciclos de Estudos', category: 'Navegação' },
  { keys: ['4'], description: 'Ir para Edital', category: 'Navegação' },
  { keys: ['5'], description: 'Ir para Estatísticas', category: 'Navegação' },
  { keys: ['6'], description: 'Ir para Jornada do Herói', category: 'Navegação' },
  { keys: ['7'], description: 'Ir para Flashcards', category: 'Navegação' },
  { keys: ['8'], description: 'Ir para Revisões', category: 'Navegação' },
  { keys: ['9'], description: 'Ir para Caderno de Erros', category: 'Navegação' },
  
  // Ações
  { keys: ['Ctrl', 'K'], description: 'Abrir Command Palette', category: 'Ações' },
  { keys: ['Ctrl', 'B'], description: 'Alternar Sidebar', category: 'Ações' },
  { keys: ['Ctrl', '/'], description: 'Mostrar esta ajuda', category: 'Ações' },
  { keys: ['ESC'], description: 'Fechar modais/sidebar', category: 'Ações' },
];

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ open, onOpenChange }) => {
  // Fechar com ESC
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-background/[0.999] backdrop-blur-md z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-card border border-white/10 rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-foreground">Atalhos de Teclado</h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  aria-label="Fechar"
                >
                  <XIcon className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-6 max-h-[500px] overflow-y-auto">
                {Object.entries(groupedShortcuts).map(([category, items]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {items.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <span className="text-sm text-foreground">{shortcut.description}</span>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, keyIndex) => (
                              <React.Fragment key={keyIndex}>
                                <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 rounded border border-white/10">
                                  {key}
                                </kbd>
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <span className="text-muted-foreground mx-1">+</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsHelp;

