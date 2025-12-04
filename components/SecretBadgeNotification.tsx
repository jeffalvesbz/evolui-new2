import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../types';
import { TrophyIcon, StarIcon, FlameIcon, BookOpenIcon, RepeatIcon, TrendingUpIcon, BookCopyIcon, SunIcon, HistoryIcon, RefreshCwIcon, BookOpenCheckIcon } from './icons';

interface SecretBadgeNotificationProps {
  badge: Badge;
  onComplete: () => void;
}

const badgeIcons: Record<string, React.FC<{ className?: string }>> = {
    'StarIcon': StarIcon,
    'TrendingUpIcon': TrendingUpIcon,
    'FlameIcon': FlameIcon,
    'RepeatIcon': RepeatIcon,
    'BookCopyIcon': BookCopyIcon,
    'TrophyIcon': TrophyIcon,
    'SunIcon': SunIcon,
    'HistoryIcon': HistoryIcon,
    'RefreshCwIcon': RefreshCwIcon,
    'BookOpenCheckIcon': BookOpenCheckIcon,
};

// Componente de partícula confete
const ConfettiPiece: React.FC<{ delay: number; x: number; color: string }> = ({ delay, x, color }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-full"
    style={{
      backgroundColor: color,
      left: `${x}%`,
      top: '-10px',
    }}
    initial={{ y: 0, opacity: 1, rotate: 0 }}
    animate={{
      y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
      opacity: [1, 1, 0],
      rotate: 360,
    }}
    transition={{
      duration: 2,
      delay,
      ease: 'easeOut',
    }}
  />
);

// Componente de estrela brilhante
const Sparkle: React.FC<{ delay: number; x: number; y: number }> = ({ delay, x, y }) => (
  <motion.div
    className="absolute"
    style={{
      left: `${x}%`,
      top: `${y}%`,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1.5, 0],
      opacity: [0, 1, 0],
      rotate: 360,
    }}
    transition={{
      duration: 1.5,
      delay,
      repeat: Infinity,
      repeatDelay: 1,
    }}
  >
    <StarIcon className="w-4 h-4 text-yellow-400" />
  </motion.div>
);

const SecretBadgeNotification: React.FC<SecretBadgeNotificationProps> = ({ badge, onComplete }) => {
  const Icon = badgeIcons[badge.icon] || TrophyIcon;
  const [showConfetti, setShowConfetti] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Cores para os confetes
  const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  useEffect(() => {
    // Animação sequencial: primeiro o efeito de impacto, depois o conteúdo
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 2500);

    const timer = setTimeout(() => {
      onComplete();
    }, 7000);

    return () => {
      clearTimeout(timer);
      clearTimeout(contentTimer);
      clearTimeout(confettiTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-background/[0.999] backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-hidden"
    >
      {/* Efeito de flash inicial */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 2, 2.5] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-0 bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40"
      />

      {/* Confetes */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 50 }).map((_, i) => (
              <ConfettiPiece
                key={i}
                delay={i * 0.02}
                x={Math.random() * 100}
                color={confettiColors[Math.floor(Math.random() * confettiColors.length)]}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Estrelas brilhantes ao redor */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <Sparkle
            key={i}
            delay={i * 0.1}
            x={Math.random() * 100}
            y={Math.random() * 100}
          />
        ))}
      </div>

      {/* Conteúdo principal */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.3, rotate: -180 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              scale: 1,
              rotate: 0,
            }}
            exit={{ 
              y: 100, 
              opacity: 0, 
              scale: 0.7,
              transition: { duration: 0.5 }
            }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15,
              delay: 0.2
            }}
            className="relative text-center p-8 md:p-12 rounded-3xl border-2 border-primary/70 bg-card/95 backdrop-blur-xl overflow-visible w-full max-w-lg shadow-2xl"
          >
            {/* Anéis de ondas concêntricas */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-3xl border-2 border-primary/30"
                initial={{ scale: 0.8, opacity: 0.8 }}
                animate={{
                  scale: [0.8, 1.3, 1.5],
                  opacity: [0.8, 0.4, 0],
                }}
                transition={{
                  duration: 2,
                  delay: 0.5 + i * 0.3,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
              />
            ))}

            {/* Background glow animado */}
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl blur-2xl opacity-40"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Ícone com animação dramática */}
            <motion.div
              initial={{ scale: 0, rotate: -360 }}
              animate={{ 
                scale: [0, 1.3, 1],
                rotate: [0, 360, 0],
              }}
              transition={{ 
                delay: 0.4,
                duration: 1,
                type: 'spring',
                stiffness: 200
              }}
              className="relative w-32 h-32 mx-auto mb-6"
            >
              {/* Halo pulsante ao redor do ícone */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0.8, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <motion.div
                className="relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br from-primary via-primary/80 to-secondary shadow-2xl"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                    '0 0 40px rgba(59, 130, 246, 0.8)',
                    '0 0 20px rgba(59, 130, 246, 0.5)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Icon className="w-16 h-16 text-black" />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Texto com animação */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-sm font-bold uppercase text-primary tracking-widest mb-2"
            >
              Conquista Secreta Desbloqueada
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
              }}
              transition={{ 
                delay: 0.9,
                type: 'spring',
                stiffness: 200
              }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mt-2 mb-4"
            >
              {badge.name}
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="text-muted-foreground mt-3 text-lg"
            >
              {badge.description}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: [0, -10, 0],
              }}
              transition={{ 
                delay: 1.3,
                y: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              }}
              className="mt-6"
            >
              <motion.p
                className="text-2xl font-bold text-yellow-400 inline-block px-6 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/30"
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(234, 179, 8, 0.3)',
                    '0 0 20px rgba(234, 179, 8, 0.6)',
                    '0 0 10px rgba(234, 179, 8, 0.3)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                +{badge.xp} XP
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SecretBadgeNotification;