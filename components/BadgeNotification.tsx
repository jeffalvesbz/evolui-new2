import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../types';
import { TrophyIcon, StarIcon, FlameIcon, BookOpenIcon, RepeatIcon, TrendingUpIcon, BookCopyIcon } from './icons';

interface BadgeNotificationProps {
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
};

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badge, onComplete }) => {
  const Icon = badgeIcons[badge.icon] || TrophyIcon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // Exibe por 5 segundos

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8, transition: { duration: 0.3 } }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm"
    >
      <div className="bg-card/80 backdrop-blur-xl border border-primary/50 rounded-2xl shadow-2xl shadow-primary/20 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary flex-shrink-0">
            <Icon className="w-8 h-8 text-black" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase text-primary">Conquista Desbloqueada!</p>
            <h3 className="font-bold text-lg text-foreground">{badge.name}</h3>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          </div>
        </div>
        <div className="text-center mt-3 pt-3 border-t border-border">
            <p className="text-sm font-bold text-yellow-400">+{badge.xp} XP</p>
        </div>
      </div>
    </motion.div>
  );
};

export default BadgeNotification;