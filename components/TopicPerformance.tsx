import React, { useMemo } from 'react';
import { SessaoEstudo, Disciplina } from '../types';
import { ThumbsUp, AlertTriangle } from 'lucide-react';

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

    // Smart Filtering Logic
    const bestTopics = useMemo(() => {
        // Topics with >= 90% accuracy OR top 5 if not enough high performers
        const highPerformers = data.filter(t => t.accuracy >= 90);
        if (highPerformers.length >= 5) return highPerformers.slice(0, 5);
        return data.slice(0, 5);
    }, [data]);

    const worstTopics = useMemo(() => {
        // Topics with < 90% accuracy, sorted by lowest accuracy
        // This prevents 100% accuracy topics from appearing in "Attention"
        return data
            .filter(t => t.accuracy < 90)
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5);
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados suficientes de questões (mínimo 5 questões por tópico).
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* Pontos Fortes */}
            <div className="space-y-4 p-5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/10 transition-all hover:shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    <ThumbsUp className="w-4 h-4" />
                    Pontos Fortes
                </h4>
                <div className="space-y-4">
                    {bestTopics.map(topic => (
                        <div key={topic.id} className="space-y-1.5 group">
                            <div className="flex justify-between items-end text-sm">
                                <span className="font-medium text-foreground/90 truncate max-w-[180px] md:max-w-[220px]" title={topic.label}>
                                    {topic.name}
                                </span>
                                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    {topic.accuracy.toFixed(0)}%
                                </span>
                            </div>

                            <div className="relative h-2.5 w-full bg-emerald-100/40 dark:bg-emerald-950/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    style={{ width: `${topic.accuracy}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs text-muted-foreground/70">
                                <span>{topic.disciplina}</span>
                                <span>{topic.correct}/{topic.total} acertos</span>
                            </div>
                        </div>
                    ))}
                    {bestTopics.length === 0 && (
                        <div className="text-sm text-muted-foreground italic py-2">
                            Continue estudando para descobrir seus pontos fortes!
                        </div>
                    )}
                </div>
            </div>

            {/* Pontos de Atenção */}
            <div className="space-y-4 p-5 rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-950/10 transition-all hover:shadow-sm">
                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" />
                    Pontos de Atenção
                </h4>
                <div className="space-y-4">
                    {worstTopics.map(topic => (
                        <div key={topic.id} className="space-y-1.5 group">
                            <div className="flex justify-between items-end text-sm">
                                <span className="font-medium text-foreground/90 truncate max-w-[180px] md:max-w-[220px]" title={topic.label}>
                                    {topic.name}
                                </span>
                                <span className="font-bold text-lg text-amber-600 dark:text-amber-400 tabular-nums">
                                    {topic.accuracy.toFixed(0)}%
                                </span>
                            </div>

                            <div className="relative h-2.5 w-full bg-amber-100/40 dark:bg-amber-950/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                    style={{ width: `${topic.accuracy}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs text-muted-foreground/70">
                                <span>{topic.disciplina}</span>
                                <span>{topic.correct}/{topic.total} acertos</span>
                            </div>
                        </div>
                    ))}
                    {worstTopics.length === 0 && (
                        <div className="text-sm text-muted-foreground italic py-2">
                            Nenhum ponto de atenção crítico identificado.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
