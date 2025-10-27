import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { TrophyIcon, MedalIcon, UsersIcon } from './icons';
import { WeeklyRankingData } from '../stores/useGamificationStore';
import Avatar from './Avatar';

interface WeeklyRankingProps {
  rankingData: WeeklyRankingData | null;
}

const PodiumItem: React.FC<{ user: any; rank: number }> = ({ user, rank }) => {
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;
    
    const rankIcon = () => {
        if (isFirst) return <TrophyIcon className="w-6 h-6 text-yellow-400" />;
        if (isSecond) return <MedalIcon className="w-5 h-5 text-gray-300" />;
        if (isThird) return <MedalIcon className="w-5 h-5 text-amber-600" />;
        return null;
    }

    return (
        <motion.div
            className={`flex flex-col items-center text-center ${isFirst ? 'order-2' : isSecond ? 'order-1' : 'order-3'} ${isFirst ? '-translate-y-4' : 'translate-y-4'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: isFirst ? -16 : 16 }}
            transition={{ delay: 0.1 * rank, type: 'spring', stiffness: 200, damping: 15 }}
        >
            <div className="relative">
                <Avatar name={user.name} size={isFirst ? 'lg' : 'md'} className={isFirst ? 'border-4 border-yellow-400' : 'border-2 border-border'}/>
                <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-1 border-2 border-border">
                    {rankIcon()}
                </div>
            </div>
            <p className="font-bold text-sm mt-2 text-foreground truncate max-w-[100px]">{user.name}</p>
            <p className="text-xs text-muted-foreground">Nível {user.level}</p>
            <p className="font-bold text-primary text-sm mt-1">{user.weekly_xp.toLocaleString()} XP</p>
        </motion.div>
    );
};


const WeeklyRanking: React.FC<WeeklyRankingProps> = ({ rankingData }) => {
    if (!rankingData) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground p-8">
                Carregando ranking...
            </div>
        );
    }
    
    const { ranking, currentUserRank } = rankingData;

    if (ranking.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                <UsersIcon className="w-12 h-12 text-muted-foreground/30 mb-4"/>
                <p className="font-semibold text-foreground">Nenhum ranking para exibir</p>
                <p className="text-sm text-muted-foreground">Adicione amigos para competir!</p>
            </div>
        )
    }

    const topThree = ranking.slice(0, 3);
    const restOfRanking = ranking.slice(3);

    return (
        <div className="relative">
            {/* Podium */}
            <div className="px-6 pt-8 pb-8 bg-gradient-to-b from-primary/5 to-transparent">
                 <div className="flex justify-around items-end min-h-[160px]">
                    {topThree.map((user, index) => (
                        <PodiumItem key={user.user_id} user={user} rank={index + 1} />
                    ))}
                </div>
            </div>

            {/* Ranking List */}
            <div className="max-h-[40vh] overflow-y-auto px-4 space-y-2 pb-24">
                {restOfRanking.map((user, index) => (
                    <motion.div 
                        key={user.user_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (index + 3) * 0.05 }}
                        className="p-2.5 rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors"
                    >
                        <span className="text-sm font-bold text-muted-foreground w-6 text-center">{index + 4}</span>
                        <Avatar name={user.name} size="sm" />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground">Nível {user.level}</p>
                        </div>
                        <p className="font-bold text-primary text-sm">{user.weekly_xp.toLocaleString()} XP</p>
                    </motion.div>
                ))}
            </div>
            
            {/* Current User Fixed Card */}
            {currentUserRank && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-card via-card to-transparent pointer-events-none">
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, type: 'spring' }}
                        className="p-3 rounded-lg flex items-center gap-3 bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/50 glass-card pointer-events-auto"
                    >
                        <span className="text-sm font-bold text-foreground w-6 text-center">{currentUserRank.rank}</span>
                        <Avatar name={currentUserRank.name} size="sm" />
                         <div className="flex-1">
                            <p className="text-sm font-bold text-foreground truncate">{currentUserRank.name} (Você)</p>
                        </div>
                        <p className="font-bold text-primary text-sm">{currentUserRank.weekly_xp.toLocaleString()} XP</p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default WeeklyRanking;
