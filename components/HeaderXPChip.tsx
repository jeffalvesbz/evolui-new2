import React from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '../stores/useGamificationStore';
import { StarIcon } from './icons';

const HeaderXPChip: React.FC = () => {
  const { stats, xpForCurrentLevel, xpForNextLevel } = useGamificationStore();

  if (!stats) {
    return null; // Don't render if stats are not loaded
  }

  const { level, xp_total } = stats;

  const currentLevelXp = xpForCurrentLevel();
  const nextLevelXp = xpForNextLevel();
  
  const xpInCurrentLevel = xp_total - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  
  const progressPercentage = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0;

  return (
    <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-card/70 border border-border glass-card">
      <StarIcon className="w-4 h-4 text-yellow-400" />
      <span className="text-sm font-bold text-foreground">
        Nível {level}
      </span>
      <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default HeaderXPChip;