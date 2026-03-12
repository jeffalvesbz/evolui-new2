import React, { useMemo } from 'react';
import { SessaoEstudo, Disciplina, Revisao, CadernoErro, Simulation } from '../types';
import { subDays, differenceInCalendarDays, format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdvancedInsightsProps {
    sessoes: SessaoEstudo[];
    disciplinas: Disciplina[];
    revisoes: Revisao[];
    erros: CadernoErro[];
    simulados: Simulation[];
}

interface Insight {
    type: 'warning' | 'success' | 'info' | 'danger';
    title: string;
    description: string;
    metric?: string;
    priority: number; // higher = more important
}

export const AdvancedInsights: React.FC<AdvancedInsightsProps> = ({ sessoes, disciplinas, revisoes, erros, simulados }) => {
    const insights = useMemo(() => {
        const result: Insight[] = [];
        const hoje = new Date();
        const seteDiasAtras = subDays(hoje, 7);
        const quatorzeDiasAtras = subDays(hoje, 14);
        const trintaDiasAtras = subDays(hoje, 30);

        const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date();
            if (dateStr.length === 10 && dateStr.includes('-')) {
                return new Date(`${dateStr}T00:00:00`);
            }
            return new Date(dateStr);
        };

        // --- 1. Disciplinas negligenciadas (com questões mas sem estudo recente) ---
        const tempoUltimoEstudoPorDisciplina = new Map<string, Date>();
        sessoes.forEach(s => {
            const disc = disciplinas.find(d => d.topicos.some(t => t.id === s.topico_id));
            if (!disc) return;
            const dataEstudo = parseDate(s.data_estudo);
            const current = tempoUltimoEstudoPorDisciplina.get(disc.id);
            if (!current || dataEstudo > current) {
                tempoUltimoEstudoPorDisciplina.set(disc.id, dataEstudo);
            }
        });

        disciplinas.forEach(d => {
            if (d.is_deck_only) return;
            const ultimoEstudo = tempoUltimoEstudoPorDisciplina.get(d.id);
            if (ultimoEstudo) {
                const diasSemEstudar = differenceInCalendarDays(hoje, ultimoEstudo);
                if (diasSemEstudar >= 14) {
                    result.push({
                        type: 'danger',
                        title: `${d.nome} sem estudo há ${diasSemEstudar} dias`,
                        description: `Você não estuda esta disciplina há ${diasSemEstudar} dias. O esquecimento se acelera após 2 semanas sem revisão.`,
                        metric: `${diasSemEstudar}d`,
                        priority: Math.min(diasSemEstudar, 60),
                    });
                }
            } else if (d.topicos.length > 0 && d.progresso < 100) {
                result.push({
                    type: 'warning',
                    title: `${d.nome} nunca estudada`,
                    description: `Esta disciplina tem ${d.topicos.length} tópicos mas nenhuma sessão de estudo registrada.`,
                    metric: `0h`,
                    priority: 40,
                });
            }
        });

        // --- 2. Disciplinas com aproveitamento caindo ---
        const sessoesComQuestoes = sessoes.filter(s => ((s.questoes_certas || 0) + (s.questoes_erradas || 0)) > 0);
        const discAccRecent = new Map<string, { certas: number; erradas: number }>();
        const discAccOlder = new Map<string, { certas: number; erradas: number }>();

        sessoesComQuestoes.forEach(s => {
            const disc = disciplinas.find(d => d.topicos.some(t => t.id === s.topico_id));
            if (!disc) return;
            const data = parseDate(s.data_estudo);
            const isRecent = data >= seteDiasAtras;
            const isOlder = data >= quatorzeDiasAtras && data < seteDiasAtras;

            const map = isRecent ? discAccRecent : isOlder ? discAccOlder : null;
            if (!map) return;

            const current = map.get(disc.nome) || { certas: 0, erradas: 0 };
            current.certas += s.questoes_certas || 0;
            current.erradas += s.questoes_erradas || 0;
            map.set(disc.nome, current);
        });

        discAccRecent.forEach((recent, nome) => {
            const older = discAccOlder.get(nome);
            if (!older) return;
            const totalRecent = recent.certas + recent.erradas;
            const totalOlder = older.certas + older.erradas;
            if (totalRecent < 5 || totalOlder < 5) return;

            const accRecent = (recent.certas / totalRecent) * 100;
            const accOlder = (older.certas / totalOlder) * 100;
            const drop = accOlder - accRecent;

            if (drop >= 10) {
                result.push({
                    type: 'danger',
                    title: `Queda de ${Math.round(drop)}% em ${nome}`,
                    description: `Seu aproveitamento caiu de ${Math.round(accOlder)}% para ${Math.round(accRecent)}% na última semana. Revise os fundamentos desta disciplina.`,
                    metric: `${Math.round(accRecent)}%`,
                    priority: 55 + drop,
                });
            } else if (drop <= -10) {
                result.push({
                    type: 'success',
                    title: `Melhora de ${Math.round(Math.abs(drop))}% em ${nome}`,
                    description: `Seu aproveitamento subiu de ${Math.round(accOlder)}% para ${Math.round(accRecent)}%. Continue assim!`,
                    metric: `${Math.round(accRecent)}%`,
                    priority: 20,
                });
            }
        });

        // --- 3. Revisões atrasadas acumulando ---
        const revisoesAtrasadas = revisoes.filter(r => r.status === 'atrasada');
        if (revisoesAtrasadas.length >= 5) {
            result.push({
                type: 'warning',
                title: `${revisoesAtrasadas.length} revisões atrasadas`,
                description: `Revisões atrasadas acumuladas prejudicam a retenção. Priorize resolver pelo menos ${Math.min(5, revisoesAtrasadas.length)} hoje.`,
                metric: `${revisoesAtrasadas.length}`,
                priority: 45 + Math.min(revisoesAtrasadas.length, 20),
            });
        }

        // --- 4. Erros não resolvidos ---
        const errosNaoResolvidos = erros.filter(e => !e.resolvido);
        if (errosNaoResolvidos.length >= 3) {
            const errosDificeis = errosNaoResolvidos.filter(e => e.nivelDificuldade === 'difícil');
            result.push({
                type: 'warning',
                title: `${errosNaoResolvidos.length} erros pendentes no caderno`,
                description: errosDificeis.length > 0
                    ? `${errosDificeis.length} deles são de nível difícil. Resolver erros antigos evita repeti-los em provas.`
                    : `Resolver erros pendentes consolida o aprendizado e evita repetir os mesmos enganos.`,
                metric: `${errosNaoResolvidos.length}`,
                priority: 35,
            });
        }

        // --- 5. Volume de questões insuficiente ---
        const sessoesUltimos30 = sessoesComQuestoes.filter(s => parseDate(s.data_estudo) >= trintaDiasAtras);
        const totalQuestoes30d = sessoesUltimos30.reduce((acc, s) => acc + (s.questoes_certas || 0) + (s.questoes_erradas || 0), 0);
        const totalQuestoesSimulados30d = simulados
            .filter(s => parseDate(s.date) >= trintaDiasAtras)
            .reduce((acc, s) => acc + s.correct + s.wrong + (s.blank || 0), 0);
        const questoesPorDia = (totalQuestoes30d + totalQuestoesSimulados30d) / 30;

        if (questoesPorDia < 10 && sessoes.length > 5) {
            result.push({
                type: 'info',
                title: `Média de ${questoesPorDia.toFixed(0)} questões/dia`,
                description: `Para concursos competitivos, recomenda-se resolver no mínimo 20-30 questões/dia. Aumente gradualmente a carga.`,
                metric: `${questoesPorDia.toFixed(0)}/dia`,
                priority: 30,
            });
        }

        // --- 6. Tempo de estudo abaixo do ideal ---
        const sessoesUltimos7 = sessoes.filter(s => parseDate(s.data_estudo) >= seteDiasAtras);
        const minutosUltimos7 = sessoesUltimos7.reduce((acc, s) => acc + s.tempo_estudado / 60, 0);
        const horasPorDia7 = (minutosUltimos7 / 60) / 7;

        if (horasPorDia7 < 2 && sessoes.length > 3) {
            result.push({
                type: 'info',
                title: `Média de ${horasPorDia7.toFixed(1)}h/dia esta semana`,
                description: `Considere aumentar a carga horária para atingir seus objetivos mais rápido. A meta recomendada é de pelo menos 3-4h/dia.`,
                metric: `${horasPorDia7.toFixed(1)}h/dia`,
                priority: 25,
            });
        }

        // --- 7. Desbalanceamento de tempo entre disciplinas ---
        const tempoPorDisc = new Map<string, number>();
        sessoes.forEach(s => {
            const disc = disciplinas.find(d => d.topicos.some(t => t.id === s.topico_id));
            if (!disc) return;
            const current = tempoPorDisc.get(disc.nome) || 0;
            tempoPorDisc.set(disc.nome, current + s.tempo_estudado / 60);
        });

        if (tempoPorDisc.size >= 3) {
            const tempos = Array.from(tempoPorDisc.values());
            const totalTempo = tempos.reduce((a, b) => a + b, 0);
            const maxTempo = Math.max(...tempos);
            const maxDiscNome = Array.from(tempoPorDisc.entries()).find(([, v]) => v === maxTempo)?.[0];
            const percentMax = (maxTempo / totalTempo) * 100;

            if (percentMax > 50) {
                result.push({
                    type: 'warning',
                    title: `${Math.round(percentMax)}% do tempo em ${maxDiscNome}`,
                    description: `Você está concentrando mais da metade do tempo em uma única disciplina. Distribua melhor para cobrir todas as matérias do edital.`,
                    metric: `${Math.round(percentMax)}%`,
                    priority: 38,
                });
            }
        }

        // --- 8. Simulados estagnados ---
        if (simulados.length >= 3) {
            const sorted = [...simulados].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const ultimos3 = sorted.slice(-3);
            const acertos = ultimos3.map(s => {
                const total = s.correct + s.wrong + (s.blank || 0);
                return total > 0 ? (s.correct / total) * 100 : 0;
            });
            const variance = Math.max(...acertos) - Math.min(...acertos);
            const avg = acertos.reduce((a, b) => a + b, 0) / acertos.length;

            if (variance < 5 && avg < 70) {
                result.push({
                    type: 'warning',
                    title: `Simulados estagnados em ~${Math.round(avg)}%`,
                    description: `Seus últimos 3 simulados variam apenas ${variance.toFixed(0)}%. Mude a estratégia: foque nos tópicos fracos ou aumente a dificuldade.`,
                    metric: `~${Math.round(avg)}%`,
                    priority: 42,
                });
            }
        }

        return result.sort((a, b) => b.priority - a.priority).slice(0, 6);
    }, [sessoes, disciplinas, revisoes, erros, simulados]);

    if (insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-sm font-medium text-foreground">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground max-w-[250px]">Continue estudando para gerar insights personalizados sobre seu desempenho.</p>
            </div>
        );
    }

    const typeConfig = {
        danger: {
            border: 'border-red-200 dark:border-red-900/40',
            bg: 'bg-red-50/50 dark:bg-red-950/10',
            icon: 'text-red-500',
            metricBg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
            dot: 'bg-red-500',
        },
        warning: {
            border: 'border-amber-200 dark:border-amber-900/40',
            bg: 'bg-amber-50/50 dark:bg-amber-950/10',
            icon: 'text-amber-500',
            metricBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
            dot: 'bg-amber-500',
        },
        success: {
            border: 'border-emerald-200 dark:border-emerald-900/40',
            bg: 'bg-emerald-50/50 dark:bg-emerald-950/10',
            icon: 'text-emerald-500',
            metricBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
            dot: 'bg-emerald-500',
        },
        info: {
            border: 'border-blue-200 dark:border-blue-900/40',
            bg: 'bg-blue-50/50 dark:bg-blue-950/10',
            icon: 'text-blue-500',
            metricBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
            dot: 'bg-blue-500',
        },
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, i) => {
                const config = typeConfig[insight.type];
                return (
                    <div
                        key={i}
                        className={`rounded-xl border ${config.border} ${config.bg} p-4 space-y-2 transition-all hover:shadow-sm`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                                <h4 className="text-sm font-semibold text-foreground truncate" title={insight.title}>
                                    {insight.title}
                                </h4>
                            </div>
                            {insight.metric && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${config.metricBg}`}>
                                    {insight.metric}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            {insight.description}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};
