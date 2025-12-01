import React, { useMemo } from 'react';
import { SessaoEstudo, Disciplina } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

interface TopicPerformanceProps {
    sessoes: SessaoEstudo[];
    disciplinas: Disciplina[];
}

export const TopicPerformance: React.FC<TopicPerformanceProps> = ({ sessoes, disciplinas }) => {
    const data = useMemo(() => {
        const topicStats = new Map<string, { correct: number; wrong: number; name: string; disciplina: string }>();

        // Helper to find topic name
        const getTopicName = (topicId: string) => {
            for (const d of disciplinas) {
                const t = d.topicos.find(t => t.id === topicId);
                if (t) return { name: t.titulo, disciplina: d.nome };
            }
            return { name: 'Desconhecido', disciplina: '?' };
        };

        sessoes.forEach(sessao => {
            if ((sessao.questoes_certas || 0) + (sessao.questoes_erradas || 0) === 0) return;

            const { name, disciplina } = getTopicName(sessao.topico_id);
            const current = topicStats.get(sessao.topico_id) || { correct: 0, wrong: 0, name, disciplina };

            current.correct += sessao.questoes_certas || 0;
            current.wrong += sessao.questoes_erradas || 0;
            topicStats.set(sessao.topico_id, current);
        });

        const result = Array.from(topicStats.entries()).map(([id, stats]) => {
            const total = stats.correct + stats.wrong;
            const accuracy = total > 0 ? (stats.correct / total) * 100 : 0;
            return {
                id,
                name: stats.name,
                disciplina: stats.disciplina,
                accuracy,
                total,
                correct: stats.correct,
                wrong: stats.wrong,
                label: `${stats.disciplina} - ${stats.name}`
            };
        });

        // Filter topics with at least 5 questions to be significant
        return result.filter(r => r.total >= 5).sort((a, b) => b.accuracy - a.accuracy);
    }, [sessoes, disciplinas]);

    const bestTopics = data.slice(0, 5);
    const worstTopics = [...data].sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados suficientes de questões (mínimo 5 questões por tópico).
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h4 className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <span className="text-lg">💪</span> Pontos Fortes
                </h4>
                <div className="space-y-3">
                    {bestTopics.map(topic => (
                        <div key={topic.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="truncate max-w-[200px]" title={topic.label}>{topic.name}</span>
                                <span className="font-bold text-emerald-600">{topic.accuracy.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${topic.accuracy}%` }}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                {topic.correct}/{topic.total} acertos
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> Pontos de Atenção
                </h4>
                <div className="space-y-3">
                    {worstTopics.map(topic => (
                        <div key={topic.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="truncate max-w-[200px]" title={topic.label}>{topic.name}</span>
                                <span className="font-bold text-red-600">{topic.accuracy.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-red-500 rounded-full"
                                    style={{ width: `${topic.accuracy}%` }}
                                />
                            </div>
                            <div className="text-xs text-muted-foreground text-right">
                                {topic.correct}/{topic.total} acertos
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
