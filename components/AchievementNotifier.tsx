import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useGamificationStore } from '../stores/useGamificationStore';
import BadgeNotification from './BadgeNotification';

const AchievementNotifier: React.FC = () => {
  const queue = useGamificationStore(state => state.newlyUnlockedBadgesQueue);
  const processNext = useGamificationStore(state => state.processNextBadgeInQueue);

  const currentBadge = queue.length > 0 ? queue[0] : null;

  return (
    <AnimatePresence>
      {currentBadge && (
        <BadgeNotification
          key={currentBadge.id}
          badge={currentBadge}
          onComplete={processNext}
        />
      )}
    </AnimatePresence>
  );
};

export default AchievementNotifier;