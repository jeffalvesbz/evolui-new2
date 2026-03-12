import React, { useMemo } from 'react';
import { SessaoEstudo, Simulation } from '../types';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeeklyComparisonProps {
    sessoes: SessaoEstudo[];
    simulados: Simulation[];
}

const formatDuration = (minutes: number) => {
    const totalMinutes = Math.max(0, Math.round(minutes ?? 0));
    if (totalMinutes < 60) return `${totalMinutes}min`;
    const hours = Math.floor(totalMinutes / 60);
    const remaining = totalMinutes % 60;
    if (remaining === 0) return `${hours}h`;
    return `${hours}h${remaining}m`;
};

export const WeeklyComparison: React.FC<WeeklyComparisonProps> = ({ sessoes, simulados }) => {
    const comparison = useMemo(() => {
        const hoje = new Date();
        const thisWeekStart = startOfWeek(hoje, { weekStartsOn: 1 });
        const thisWeekEnd = endOfWeek(hoje, { weekStartsOn: 1 });
        const lastWeekStart = subWeeks(thisWeekStart, 1);
        const lastWeekEnd = subWeeks(thisWeekEnd, 1);

        const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.length === 10 && dateStr.includes('-')) {
                return new Date(`${dateStr}T00:00:00`);
            }
            return new Date(dateStr);
        };

        const calcWeek = (start: Date, end: Date) => {
            const weekSessoes = sessoes.filter(s => {
                const d = parseDate(s.data_estudo);
                return d >= start && d <= end;
            });
            const weekSimulados = simulados.filter(s => {
                const d = parseDate(s.date);
                return d >= start && d <= end;
            });

            const tempoMinutos = weekSessoes.reduce((acc, s) => acc + s.tempo_estudado / 60, 0)
                + weekSimulados.reduce((acc, s) => acc + s.duration_minutes, 0);

            const sessoesComQ = weekSessoes.filter(s => ((s.questoes_certas || 0) + (s.questoes_erradas || 0)) > 0);
            const certas = sessoesComQ.reduce((acc, s) => acc + (s.questoes_certas || 0), 0)
                + weekSimulados.reduce((acc, s) => acc + s.correct, 0);
            const erradas = sessoesComQ.reduce((acc, s) => acc + (s.questoes_erradas || 0), 0)
                + weekSimulados.reduce((acc, s) => acc + s.wrong, 0);
            const totalQ = certas + erradas + weekSimulados.reduce((acc, s) => acc + (s.blank || 0), 0);
            const acerto = totalQ > 0 ? Math.round((certas / totalQ) * 100) : 0;

            const diasAtivos = new Set(weekSessoes.map(s => format(parseDate(s.data_estudo), 'yyyy-MM-dd'))).size;

            return {
                tempoMinutos,
                totalSessoes: weekSessoes.length + weekSimulados.length,
                totalQuestoes: totalQ,
                acerto,
                diasAtivos,
            };
        };

        const thisWeek = calcWeek(thisWeekStart, thisWeekEnd);
        const lastWeek = calcWeek(lastWeekStart, lastWeekEnd);

        return { thisWeek, lastWeek };
    }, [sessoes, simulados]);

    const { thisWeek, lastWeek } = comparison;

    const metrics = [
        {
            label: 'Tempo de Estudo',
            current: formatDuration(thisWeek.tempoMinutos),
            previous: formatDuration(lastWeek.tempoMinutos),
            currentRaw: thisWeek.tempoMinutos,
            previousRaw: lastWeek.tempoMinutos,
        },
        {
            label: 'Questões Resolvidas',
            current: String(thisWeek.totalQuestoes),
            previous: String(lastWeek.totalQuestoes),
            currentRaw: thisWeek.totalQuestoes,
            previousRaw: lastWeek.totalQuestoes,
        },
        {
            label: 'Aproveitamento',
            current: `${thisWeek.acerto}%`,
            previous: `${lastWeek.acerto}%`,
            currentRaw: thisWeek.acerto,
            previousRaw: lastWeek.acerto,
        },
        {
            label: 'Dias Ativos',
            current: `${thisWeek.diasAtivos}/7`,
            previous: `${lastWeek.diasAtivos}/7`,
            currentRaw: thisWeek.diasAtivos,
            previousRaw: lastWeek.diasAtivos,
        },
        {
            label: 'Atividades',
            current: String(thisWeek.totalSessoes),
            previous: String(lastWeek.totalSessoes),
            currentRaw: thisWeek.totalSessoes,
            previousRaw: lastWeek.totalSessoes,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 text-xs text-muted-foreground font-medium px-1">
                <span>Métrica</span>
                <span className="text-center">Esta Semana</span>
                <span className="text-center">Semana Anterior</span>
            </div>
            <div className="space-y-2">
                {metrics.map((m, i) => {
                    const diff = m.previousRaw > 0
                        ? ((m.currentRaw - m.previousRaw) / m.previousRaw) * 100
                        : m.currentRaw > 0 ? 100 : 0;
                    const isPositive = diff > 0;
                    const isNeutral = diff === 0;

                    return (
                        <div key={i} className="grid grid-cols-3 items-center py-2.5 px-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                            <span className="text-sm font-medium text-foreground">{m.label}</span>
                            <div className="text-center">
                                <span className="text-sm font-bold text-foreground">{m.current}</span>
                                {!isNeutral && (
                                    <span className={`ml-1.5 text-[10px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {isPositive ? '↑' : '↓'}{Math.abs(Math.round(diff))}%
                                    </span>
                                )}
                            </div>
                            <div className="text-center">
                                <span className="text-sm text-muted-foreground">{m.previous}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
