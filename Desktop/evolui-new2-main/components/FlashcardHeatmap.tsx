import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import PremiumFeatureWrapper from './PremiumFeatureWrapper';

interface FlashcardHeatmapProps {
    reviewsByDay: { date: string; count: number }[];
}

export const FlashcardHeatmap: React.FC<FlashcardHeatmapProps> = ({ reviewsByDay }) => {
    const { planType, hasActiveSubscription, isTrialActive } = useSubscriptionStore();

    const isActive = hasActiveSubscription() || isTrialActive();
    const isLocked = planType === 'free' || (!isActive && planType !== 'premium');

    const maxCount = Math.max(...reviewsByDay.map(d => d.count), 1);

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-muted';
        const intensity = count / maxCount;
        if (intensity < 0.25) return 'bg-primary/20';
        if (intensity < 0.5) return 'bg-primary/40';
        if (intensity < 0.75) return 'bg-primary/60';
        return 'bg-primary';
    };

    return (
        <PremiumFeatureWrapper
            isLocked={isLocked}
            requiredPlan="pro"
            feature="Heatmap de Atividade"
            blurAmount="md"
        >
            <div className="bg-card/60 backdrop-blur-xl rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Atividade (últimos 30 dias)</h3>

                <div className="grid grid-cols-10 gap-1.5">
                    {reviewsByDay.map(({ date, count }) => {
                        const dateObj = parseISO(date);
                        const dayLabel = format(dateObj, 'd MMM', { locale: ptBR });

                        return (
                            <div
                                key={date}
                                className="group relative"
                            >
                                <div
                                    className={`w-full aspect-square rounded-sm ${getIntensityClass(count)} transition-all hover:ring-2 hover:ring-primary/50 cursor-pointer`}
                                    title={`${dayLabel}: ${count} ${count === 1 ? 'card' : 'cards'}`}
                                />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {dayLabel}: {count} {count === 1 ? 'card' : 'cards'}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                    <span>Menos</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-muted"></div>
                        <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
                        <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                        <div className="w-3 h-3 rounded-sm bg-primary/60"></div>
                        <div className="w-3 h-3 rounded-sm bg-primary"></div>
                    </div>
                    <span>Mais</span>
                </div>
            </div>
        </PremiumFeatureWrapper>
    );
};
