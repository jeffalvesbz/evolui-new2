import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
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

const SecretBadgeNotification: React.FC<SecretBadgeNotificationProps> = ({ badge, onComplete }) => {
  const Icon = badgeIcons[badge.icon] || TrophyIcon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 7000); // Show for 7 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -100, opacity: 0, scale: 0.7 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.7 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.2 }}
        className="relative text-center p-8 rounded-2xl border border-primary/50 bg-card overflow-hidden w-full max-w-md"
      >
        {/* Background glow */}
        <div className="absolute -inset-px bg-gradient-to-r from-primary to-secondary rounded-2xl blur-lg opacity-30 animate-pulse"></div>
        
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ delay: 0.5, duration: 0.8, type: 'spring' }} className="w-24 h-24 mx-auto rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary mb-4">
          <Icon className="w-12 h-12 text-black" />
        </motion.div>

        <p className="text-sm font-bold uppercase text-primary tracking-widest">Conquista Secreta Desbloqueada</p>
        <h2 className="text-3xl font-bold text-foreground mt-2">{badge.name}</h2>
        <p className="text-muted-foreground mt-3">{badge.description}</p>
        <p className="text-lg font-bold text-yellow-400 mt-4">+{badge.xp} XP</p>
      </motion.div>
    </motion.div>
  );
};

export default SecretBadgeNotification;