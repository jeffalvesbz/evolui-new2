import React from 'react';
import { FlashcardStats } from '../types';
import { TrendingUpIcon, TargetIcon, FlameIcon, CheckCircle2Icon } from './icons';

interface FlashcardStatsCardProps {
    stats: FlashcardStats;
    loading?: boolean;
}

export const FlashcardStatsCard: React.FC<FlashcardStatsCardProps> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="bg-card rounded-xl p-6 border border-border animate-pulse">
                <div className="h-6 bg-muted rounded w-32 mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 bg-muted rounded w-16"></div>
                            <div className="h-8 bg-muted rounded w-12"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card/60 backdrop-blur-xl rounded-xl p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5 text-primary" />
                Estatísticas
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatItem
                    icon={<TargetIcon className="w-5 h-5" />}
                    label="Hoje"
                    value={stats.cardsStudiedToday}
                    color="text-blue-400"
                />
                <StatItem
                    icon={<CheckCircle2Icon className="w-5 h-5" />}
                    label="Esta Semana"
                    value={stats.cardsStudiedThisWeek}
                    color="text-green-400"
                />
                <StatItem
                    icon={<TrendingUpIcon className="w-5 h-5" />}
                    label="Taxa de Acerto"
                    value={`${stats.accuracyRate}%`}
                    color="text-purple-400"
                />
            </div>
        </div>
    );
};

interface StatItemProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    color: string;
    subtitle?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, color, subtitle }) => {
    return (
        <div className="flex flex-col">
            <div className={`flex items-center gap-1 text-sm text-muted-foreground mb-1 ${color}`}>
                {icon}
                <span>{label}</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
        </div>
    );
};
