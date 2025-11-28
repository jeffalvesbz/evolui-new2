import React from 'react';
import { motion } from 'framer-motion';
import { useEstudosStore } from '../stores/useEstudosStore';
import { PlayCircleIcon } from './icons';

const QuickStartTimerButton: React.FC = () => {
  const { sessaoAtual, iniciarSessaoInteligente } = useEstudosStore();

  if (sessaoAtual) {
    return null; // Don't show if a session is already active
  }

  return (
    <motion.button
      onClick={iniciarSessaoInteligente}
      className="fixed z-40 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary text-black flex items-center justify-center shadow-lg shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary"
      style={{
        bottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        right: '1.5rem',
      }}
      aria-label="Iniciar Cronômetro Rápido"
      title="Iniciar Cronômetro Rápido"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <PlayCircleIcon className="w-8 h-8" />
    </motion.button>
  );
};

export default QuickStartTimerButton;
