import React, { useMemo, useState } from 'react';
import { SessaoEstudo, Disciplina } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { subDays, format, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DisciplineEvolutionProps {
    sessoes: SessaoEstudo[];
    disciplinas: Disciplina[];
}

const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#6366F1', '#14B8A6'];

export const DisciplineEvolution: React.FC<DisciplineEvolutionProps> = ({ sessoes, disciplinas }) => {
    const [selectedDiscs, setSelectedDiscs] = useState<Set<string>>(new Set());

    const { chartData, availableDiscs } = useMemo(() => {
        const hoje = new Date();
        const start = subDays(hoje, 56); // 8 weeks
        const weeks = eachWeekOfInterval({ start, end: hoje }, { weekStartsOn: 1 });

        const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.length === 10 && dateStr.includes('-')) {
                return new Date(`${dateStr}T00:00:00`);
            }
            return new Date(dateStr);
        };

        // Find disciplines that have question data
        const sessoesComQ = sessoes.filter(s => ((s.questoes_certas || 0) + (s.questoes_erradas || 0)) > 0);
        const discMap = new Map<string, string>();
        sessoesComQ.forEach(s => {
            const disc = disciplinas.find(d => d.topicos.some(t => t.id === s.topico_id));
            if (disc && !discMap.has(disc.id)) {
                discMap.set(disc.id, disc.nome);
            }
        });

        const availableDiscs = Array.from(discMap.entries()).map(([id, nome]) => ({ id, nome }));

        // Calculate weekly accuracy per discipline
        const chartData = weeks.map(weekStart => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const label = format(weekStart, 'dd/MM');

            const entry: Record<string, any> = { name: label };

            availableDiscs.forEach(disc => {
                const weekSessoes = sessoesComQ.filter(s => {
                    const d = parseDate(s.data_estudo);
                    if (d < weekStart || d > weekEnd) return false;
                    const sDisc = disciplinas.find(dd => dd.topicos.some(t => t.id === s.topico_id));
                    return sDisc?.id === disc.id;
                });

                const certas = weekSessoes.reduce((acc, s) => acc + (s.questoes_certas || 0), 0);
                const erradas = weekSessoes.reduce((acc, s) => acc + (s.questoes_erradas || 0), 0);
                const total = certas + erradas;

                entry[disc.nome] = total >= 3 ? Math.round((certas / total) * 100) : null;
            });

            return entry;
        });

        return { chartData, availableDiscs };
    }, [sessoes, disciplinas]);

    // Auto-select top 3 disciplines by question count if nothing selected
    const activeDiscs = useMemo(() => {
        if (selectedDiscs.size > 0) return selectedDiscs;

        const sessoesComQ = sessoes.filter(s => ((s.questoes_certas || 0) + (s.questoes_erradas || 0)) > 0);
        const countByDisc = new Map<string, number>();
        sessoesComQ.forEach(s => {
            const disc = disciplinas.find(d => d.topicos.some(t => t.id === s.topico_id));
            if (disc) {
                countByDisc.set(disc.nome, (countByDisc.get(disc.nome) || 0) + 1);
            }
        });

        const top3 = Array.from(countByDisc.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([nome]) => nome);

        return new Set(top3);
    }, [selectedDiscs, sessoes, disciplinas]);

    const toggleDisc = (nome: string) => {
        setSelectedDiscs(prev => {
            const next = new Set(prev.size > 0 ? prev : activeDiscs);
            if (next.has(nome)) {
                next.delete(nome);
            } else {
                next.add(nome);
            }
            return next;
        });
    };

    if (availableDiscs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-3">
                <p className="text-sm text-muted-foreground">Resolva questões em diferentes disciplinas para ver a evolução do aproveitamento ao longo do tempo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Discipline selector chips */}
            <div className="flex flex-wrap gap-2">
                {availableDiscs.map((disc, i) => {
                    const isActive = activeDiscs.has(disc.nome);
                    return (
                        <button
                            key={disc.id}
                            onClick={() => toggleDisc(disc.nome)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                                isActive
                                    ? 'border-transparent text-white font-medium shadow-sm'
                                    : 'border-border text-muted-foreground hover:border-foreground/30'
                            }`}
                            style={isActive ? { backgroundColor: COLORS[i % COLORS.length] } : undefined}
                        >
                            {disc.nome.length > 20 ? disc.nome.substring(0, 20) + '...' : disc.nome}
                        </button>
                    );
                })}
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                        dataKey="name"
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="var(--color-muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--color-card)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-foreground)',
                            borderRadius: '8px',
                        }}
                        itemStyle={{ color: 'var(--color-foreground)' }}
                        formatter={(value: number | null) => value !== null ? [`${value}%`, ''] : ['Sem dados', '']}
                    />
                    {availableDiscs.map((disc, i) => {
                        if (!activeDiscs.has(disc.nome)) return null;
                        return (
                            <Line
                                key={disc.id}
                                type="monotone"
                                dataKey={disc.nome}
                                stroke={COLORS[i % COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                                connectNulls={false}
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>

            <p className="text-[11px] text-muted-foreground text-center">
                Aproveitamento semanal por disciplina (mín. 3 questões/semana para exibir)
            </p>
        </div>
    );
};
