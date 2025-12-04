import React from 'react';
import { motion } from 'framer-motion';
import { useGamificationStore } from '../stores/useGamificationStore';
import { StarIcon, FlameIcon, TrophyIcon, ArrowRightIcon } from './icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../lib/dashboardMocks';
import { Progress } from '../lib/dashboardMocks';

interface MiniGamificationCardProps {
  setActiveView: (view: string) => void;
}

export const MiniGamificationCard: React.FC<MiniGamificationCardProps> = ({ setActiveView }) => {
  const { stats, xpForCurrentLevel, xpForNextLevel } = useGamificationStore();

  if (!stats) {
    return null; // or a loading skeleton
  }

  const { level, xp_total, current_streak_days } = stats;

  const currentLevelXp = xpForCurrentLevel();
  const nextLevelXp = xpForNextLevel();
  
  const xpInCurrentLevel = xp_total - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  
  const progressPercentage = xpNeededForLevel > 0 ? Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100) : 0;
  
  const xpToShow = `${xpInCurrentLevel}/${xpNeededForLevel}`;

  return (
    <Card className="glass-card flex flex-col">
      <CardHeader>
        <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
          <TrophyIcon className="h-4 w-4" />
          Sua Jornada
        </CardDescription>
        <CardTitle className="text-2xl mt-1">Progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
            {/* Level & XP */}
            <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2">
                        <StarIcon className="w-5 h-5 text-yellow-400" />
                        <span className="font-bold text-lg text-foreground">Nível {level}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{xpToShow} XP</span>
                </div>
                <Progress value={progressPercentage} />
            </div>

            {/* Streak */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                    <FlameIcon className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-foreground">Streak</span>
                </div>
                <span className="font-mono text-lg font-bold text-foreground">{current_streak_days} dias</span>
            </div>
        </div>

        <button 
            onClick={() => setActiveView('gamificacao')}
            className="w-full h-10 mt-4 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            Ver Conquistas
            <ArrowRightIcon className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
};