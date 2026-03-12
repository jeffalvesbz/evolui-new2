import React, { useMemo } from 'react';
import { SessaoEstudo, Simulation } from '../types';
import { subDays, format, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsistencyScoreProps {
    sessoes: SessaoEstudo[];
    simulados: Simulation[];
}

export const ConsistencyScore: React.FC<ConsistencyScoreProps> = ({ sessoes, simulados }) => {
    const metrics = useMemo(() => {
        const hoje = new Date();
        const trintaDiasAtras = subDays(hoje, 29);
        const dias = eachDayOfInterval({ start: trintaDiasAtras, end: hoje });

        const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.length === 10 && dateStr.includes('-')) {
                return new Date(`${dateStr}T00:00:00`);
            }
            return new Date(dateStr);
        };

        // Count active days and minutes per day
        const dayActivity = new Map<string, number>();
        sessoes.forEach(s => {
            const d = parseDate(s.data_estudo);
            if (d < trintaDiasAtras) return;
            const key = format(d, 'yyyy-MM-dd');
            dayActivity.set(key, (dayActivity.get(key) || 0) + s.tempo_estudado / 60);
        });
        simulados.forEach(s => {
            const d = parseDate(s.date);
            if (d < trintaDiasAtras) return;
            const key = format(d, 'yyyy-MM-dd');
            dayActivity.set(key, (dayActivity.get(key) || 0) + s.duration_minutes);
        });

        const activeDays = dias.filter(d => {
            const key = format(d, 'yyyy-MM-dd');
            return (dayActivity.get(key) || 0) > 0;
        }).length;

        const frequencyScore = Math.round((activeDays / 30) * 100);

        // Calculate variance in study time (lower variance = more consistent)
        const dailyMinutes = dias.map(d => dayActivity.get(format(d, 'yyyy-MM-dd')) || 0);
        const activeDayMinutes = dailyMinutes.filter(m => m > 0);
        const avgMinutes = activeDayMinutes.length > 0
            ? activeDayMinutes.reduce((a, b) => a + b, 0) / activeDayMinutes.length
            : 0;

        let regularityScore = 0;
        if (activeDayMinutes.length >= 3) {
            const variance = activeDayMinutes.reduce((acc, m) => acc + Math.pow(m - avgMinutes, 2), 0) / activeDayMinutes.length;
            const stdDev = Math.sqrt(variance);
            const cv = avgMinutes > 0 ? (stdDev / avgMinutes) : 1; // coefficient of variation
            // Lower CV = more consistent. CV of 0 = perfect, CV > 1 = very inconsistent
            regularityScore = Math.round(Math.max(0, Math.min(100, (1 - cv) * 100)));
        }

        // Longest gap in last 30 days
        let longestGap = 0;
        let currentGap = 0;
        dias.forEach(d => {
            const key = format(d, 'yyyy-MM-dd');
            if ((dayActivity.get(key) || 0) > 0) {
                currentGap = 0;
            } else {
                currentGap++;
                longestGap = Math.max(longestGap, currentGap);
            }
        });

        // Overall consistency score (weighted average)
        const overallScore = Math.round(frequencyScore * 0.6 + regularityScore * 0.4);

        // Weekend vs weekday ratio
        let weekdayActive = 0;
        let weekendActive = 0;
        let weekdayTotal = 0;
        let weekendTotal = 0;
        dias.forEach(d => {
            const key = format(d, 'yyyy-MM-dd');
            const dayOfWeek = d.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const minutes = dayActivity.get(key) || 0;

            if (isWeekend) {
                weekendTotal++;
                if (minutes > 0) weekendActive++;
            } else {
                weekdayTotal++;
                if (minutes > 0) weekdayActive++;
            }
        });

        const weekdayRate = weekdayTotal > 0 ? Math.round((weekdayActive / weekdayTotal) * 100) : 0;
        const weekendRate = weekendTotal > 0 ? Math.round((weekendActive / weekendTotal) * 100) : 0;

        return {
            overallScore,
            frequencyScore,
            regularityScore,
            activeDays,
            longestGap,
            avgMinutes: Math.round(avgMinutes),
            weekdayRate,
            weekendRate,
        };
    }, [sessoes, simulados]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Bom';
        if (score >= 40) return 'Regular';
        return 'Precisa melhorar';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'from-emerald-500';
        if (score >= 60) return 'from-amber-500';
        return 'from-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Main Score */}
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke="currentColor"
                            className={getScoreColor(metrics.overallScore)}
                            strokeWidth="8"
                            strokeDasharray={`${(metrics.overallScore / 100) * 264} 264`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                            {metrics.overallScore}
                        </span>
                        <span className="text-[10px] text-muted-foreground">de 100</span>
                    </div>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(metrics.overallScore)}`}>
                    {getScoreLabel(metrics.overallScore)}
                </span>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/20 text-center space-y-1">
                    <div className="text-xl font-bold text-foreground">{metrics.activeDays}<span className="text-sm text-muted-foreground">/30</span></div>
                    <div className="text-[10px] text-muted-foreground">Dias Ativos</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 text-center space-y-1">
                    <div className="text-xl font-bold text-foreground">{metrics.longestGap}<span className="text-sm text-muted-foreground">d</span></div>
                    <div className="text-[10px] text-muted-foreground">Maior Intervalo</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 text-center space-y-1">
                    <div className="text-xl font-bold text-foreground">{metrics.weekdayRate}<span className="text-sm text-muted-foreground">%</span></div>
                    <div className="text-[10px] text-muted-foreground">Presença Seg-Sex</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 text-center space-y-1">
                    <div className="text-xl font-bold text-foreground">{metrics.weekendRate}<span className="text-sm text-muted-foreground">%</span></div>
                    <div className="text-[10px] text-muted-foreground">Presença Fim-Sem</div>
                </div>
            </div>

            {/* Sub-scores */}
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Frequência</span>
                        <span className="font-semibold text-foreground">{metrics.frequencyScore}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(metrics.frequencyScore)} to-transparent transition-all duration-500`}
                            style={{ width: `${metrics.frequencyScore}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Regularidade</span>
                        <span className="font-semibold text-foreground">{metrics.regularityScore}%</span>
                    </div>
                    <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full bg-gradient-to-r ${getScoreBg(metrics.regularityScore)} to-transparent transition-all duration-500`}
                            style={{ width: `${metrics.regularityScore}%` }}
                        />
                    </div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                Baseado nos últimos 30 dias. Frequência mede quantos dias você estudou. Regularidade mede o quão uniforme é sua carga diária.
            </p>
        </div>
    );
};
