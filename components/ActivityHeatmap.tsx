import React, { useMemo } from 'react';
import { SessaoEstudo } from '../types';
import { format, subDays, eachDayOfInterval, startOfDay, isSameDay, getDay, startOfYear, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';

interface ActivityHeatmapProps {
    sessoes: SessaoEstudo[];
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ sessoes }) => {
    const today = new Date();
    const startDate = subDays(today, 180); // Last 6 months (approx) to fit without scroll

    const data = useMemo(() => {
        const days = eachDayOfInterval({ start: startDate, end: today });
        const activityMap = new Map<string, number>();

        sessoes.forEach(sessao => {
            const dateKey = format(new Date(sessao.data_estudo), 'yyyy-MM-dd');
            const currentMinutes = activityMap.get(dateKey) || 0;
            activityMap.set(dateKey, currentMinutes + (sessao.tempo_estudado / 60));
        });

        return days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const minutes = activityMap.get(dateKey) || 0;
            let level = 0;
            if (minutes > 0) level = 1;
            if (minutes > 30) level = 2;
            if (minutes > 60) level = 3;
            if (minutes > 120) level = 4;

            return {
                date: day,
                minutes,
                level,
            };
        });
    }, [sessoes, startDate]);

    const weeks = useMemo(() => {
        const weeksArray: typeof data[] = [];
        let currentWeek: typeof data = [];

        // Pad the first week if it doesn't start on Sunday
        const firstDayOfWeek = getDay(startDate);
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null as any);
        }

        data.forEach(day => {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeksArray.push(currentWeek);
                currentWeek = [];
            }
        });

        if (currentWeek.length > 0) {
            weeksArray.push(currentWeek);
        }

        return weeksArray;
    }, [data, startDate]);

    const getLevelColor = (level: number) => {
        switch (level) {
            case 0: return 'bg-secondary/30';
            case 1: return 'bg-emerald-200 dark:bg-emerald-900';
            case 2: return 'bg-emerald-300 dark:bg-emerald-700';
            case 3: return 'bg-emerald-400 dark:bg-emerald-600';
            case 4: return 'bg-emerald-500 dark:bg-emerald-500';
            default: return 'bg-secondary/30';
        }
    };

    return (
        <div className="w-full pb-2">
            <div className="flex gap-1 flex-wrap">
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1">
                        {week.map((day, dayIndex) => {
                            if (!day) return <div key={`empty-${weekIndex}-${dayIndex}`} className="w-3 h-3" />;

                            return (
                                <TooltipProvider key={day.date.toISOString()}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} transition-colors hover:ring-1 hover:ring-ring`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs font-medium">
                                                {format(day.date, "d 'de' MMMM, yyyy", { locale: ptBR })}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {day.minutes > 0
                                                    ? `${Math.round(day.minutes)} minutos estudados`
                                                    : 'Nenhuma atividade'}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-secondary/30" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-300 dark:bg-emerald-700" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
                    <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-500" />
                </div>
                <span>Mais</span>
            </div>
        </div>
    );
};
