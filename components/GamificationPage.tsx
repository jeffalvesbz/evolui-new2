import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrophyIcon, StarIcon, FlameIcon, BookOpenIcon, RepeatIcon, FootprintsIcon,
    PlusCircleIcon, CalendarClockIcon, TargetIcon, TrendingUpIcon, BookCopyIcon,
    BookOpenCheckIcon,
    MedalIcon
} from './icons';
import { useGamificationStore, WeeklyRankingData } from '../stores/useGamificationStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useFriendsStore } from '../stores/useFriendsStore';
import { Badge as BadgeType, XpLogEvent, XpLogEntry } from '../types';
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
// FIX: Changed date-fns/locale import to a subpath import to resolve type error.
import { ptBR } from 'date-fns/locale';
import WeeklyRanking from './WeeklyRanking';
import FriendsManagement from './FriendsManagement';

// Icon mapping for activities
const activityIcons: Record<XpLogEvent, React.FC<{ className?: string }>> = {
    'cronometro_finalizado': BookOpenIcon,
    'revisao_concluida': RepeatIcon,
    'trilha_topico_concluido': FootprintsIcon,
    'estudo_extra': PlusCircleIcon,
    'revisao_atrasada': CalendarClockIcon,
    'meta_semanal_completa': TargetIcon,
    'revisao_dificil': BookCopyIcon,
    'estudo_manual': BookOpenIcon,
    'missao_diaria_completa': TargetIcon,
    'conquista_desbloqueada': MedalIcon,
};

const getEventMessage = (event: XpLogEvent): string => {
    switch (event) {
        case 'cronometro_finalizado':
            return 'Estudo concluído';
        case 'revisao_concluida':
            return 'Revisão concluída';
        case 'trilha_topico_concluido':
            return 'Tópico da trilha concluído';
        case 'estudo_extra':
            return 'Estudo extra';
        case 'revisao_atrasada':
            return 'Revisão em dia';
        case 'meta_semanal_completa':
            return 'Meta semanal completa';
        case 'conquista_desbloqueada':
            return 'Conquista desbloqueada';
        default:
            return 'Dedicação';
    }
};

const SecretBadgePlaceholder: React.FC = () => (
    <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center text-center transition-all opacity-70 hover:opacity-100 hover:border-primary/50">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2 bg-muted">
            <span className="text-2xl font-bold text-muted-foreground">?</span>
        </div>
        <p className="font-bold text-sm text-foreground">Conquista Misteriosa</p>
        <p className="text-xs text-muted-foreground flex-grow">Continue sua jornada para revelar.</p>
    </div>
);

const GamificationPage = () => {
    const { stats, badges, xpLog, unlockedBadges, xpForCurrentLevel, xpForNextLevel, weeklyRanking, fetchWeeklyRanking } = useGamificationStore();
    const { friendsRanking, fetchFriendsRanking } = useFriendsStore();
    const user = useAuthStore(state => state.user);
    const [activeRanking, setActiveRanking] = useState<'global' | 'friends'>('global');

    useEffect(() => {
        if (user?.id) {
            fetchWeeklyRanking(user.id);
            fetchFriendsRanking(user.id);
        }
    }, [user?.id, fetchWeeklyRanking, fetchFriendsRanking]);

    const unlocked = useMemo(() => unlockedBadges(), [stats, badges, unlockedBadges]);
    const locked = useMemo(() => badges.filter(b => !unlocked.some(u => u.id === b.id)), [badges, unlocked]);

    if (!stats) {
        return <div className="text-center py-24">Carregando dados de gamificação...</div>;
    }

    const { level, xp_total, current_streak_days, best_streak_days } = stats;
    const currentLevelXp = xpForCurrentLevel();
    const nextLevelXp = xpForNextLevel();
    const xpInCurrentLevel = xp_total - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;
    const progressPercentage = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 0;
    
    const rankingToDisplay = activeRanking === 'global' ? weeklyRanking : friendsRanking;
    
    return (
        <div data-tutorial="gamificacao-content" className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><TrophyIcon className="w-8 h-8"/> Jornada do Herói</h1>
                <p className="text-muted-foreground mt-1">Acompanhe seu progresso, compita com amigos e ganhe conquistas.</p>
            </header>
            
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
                {/* Left Column: Ranking and Badges */}
                <div className="space-y-6">
                    <Card className="border-border shadow-md">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2"><TrophyIcon className="w-5 h-5 text-primary" /> Ranking Semanal</CardTitle>
                                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                                    <button onClick={() => setActiveRanking('global')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeRanking === 'global' ? 'bg-background shadow' : 'text-muted-foreground'}`}>Global</button>
                                    <button onClick={() => setActiveRanking('friends')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${activeRanking === 'friends' ? 'bg-background shadow' : 'text-muted-foreground'}`}>Amigos</button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                           <WeeklyRanking rankingData={rankingToDisplay} />
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md">
                        <CardHeader><CardTitle>Conquistas</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {unlocked.map(badge => <BadgeCard key={badge.id} badge={badge} unlocked />)}
                            {locked.map(badge => 
                                badge.is_secret 
                                ? <SecretBadgePlaceholder key={badge.id} /> 
                                : <BadgeCard key={badge.id} badge={badge} unlocked={false} />
                            )}
                        </CardContent>
                    </Card>
                     <Card className="border-border shadow-md">
                        <CardHeader><CardTitle>Atividade Recente</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {xpLog.slice(0, 15).map(log => <LogEntry key={log.id} log={log} />)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: User Stats & Friends */}
                <div className="space-y-6 lg:sticky lg:top-24">
                    <Card className="p-6 bg-gradient-to-br from-secondary/80 to-primary/80 text-black">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative">
                                <StarIcon className="w-16 h-16 text-yellow-300" />
                                <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{level}</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-widest">Nível {level}</p>
                                <h2 className="text-xl font-bold">Estudante Dedicado</h2>
                            </div>
                        </div>
                         <div className="w-full">
                            <div className="flex justify-between items-baseline mb-1 text-sm font-semibold">
                                <span>Progresso</span>
                                <span>{xpInCurrentLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP</span>
                            </div>
                            <div className="w-full bg-muted/50 rounded-full h-3"><motion.div className="h-3 rounded-full bg-yellow-300" initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} transition={{ duration: 0.5, ease: "easeOut" }} /></div>
                        </div>
                    </Card>
                    
                    <div className="grid grid-cols-2 gap-6">
                         <Card className="text-center border-border shadow-md p-4">
                            <FlameIcon className="w-8 h-8 text-orange-400 mx-auto mb-1"/>
                            <p className="text-3xl font-bold">{current_streak_days}</p>
                            <p className="text-xs text-muted-foreground">Streak Atual</p>
                        </Card>
                         <Card className="text-center border-border shadow-md p-4">
                            <TrendingUpIcon className="w-8 h-8 text-secondary mx-auto mb-1"/>
                            <p className="text-3xl font-bold">{best_streak_days}</p>
                            <p className="text-xs text-muted-foreground">Melhor Streak</p>
                        </Card>
                    </div>

                    <FriendsManagement />
                </div>
            </div>
        </div>
    );
};

const BadgeCard: React.FC<{ badge: BadgeType, unlocked: boolean }> = ({ badge, unlocked }) => {
    const Icon = {
        'StarIcon': StarIcon,
        'TrendingUpIcon': TrendingUpIcon,
        'FlameIcon': FlameIcon,
        'RepeatIcon': RepeatIcon,
        'BookCopyIcon': BookCopyIcon,
        'TrophyIcon': TrophyIcon,
        'RefreshCwIcon': TrendingUpIcon, // Placeholder
        'HistoryIcon': TrendingUpIcon, // Placeholder
        'SunIcon': TrendingUpIcon, // Placeholder
        'BookOpenCheckIcon': BookOpenCheckIcon,
    }[badge.icon] || TrophyIcon;

    return (
         <div className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${unlocked ? 'border-border bg-card/80 shadow-md' : 'bg-muted/50 opacity-60'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${unlocked ? 'bg-gradient-to-br from-primary to-secondary' : 'bg-muted'}`}>
                <Icon className={`w-6 h-6 ${unlocked ? 'text-black' : 'text-muted-foreground'}`}/>
            </div>
            <p className="font-bold text-sm text-foreground">{badge.name}</p>
            <p className="text-xs text-muted-foreground flex-grow">{badge.description}</p>
            <p className="text-xs font-bold text-yellow-400 mt-2">{badge.xp} XP</p>
        </div>
    );
};

const LogEntry: React.FC<{ log: XpLogEntry }> = ({ log }) => {
    const Icon = activityIcons[log.event] || BookCopyIcon;
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Icon className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">+{log.amount} XP</p>
                <p className="text-xs text-muted-foreground">{getEventMessage(log.event)}</p>
            </div>
            {/* FIX: Changed locale import to a named import. */}
            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}</p>
        </div>
    );
};

export default GamificationPage;