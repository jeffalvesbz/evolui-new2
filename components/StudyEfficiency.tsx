import React, { useMemo } from 'react';
import { SessaoEstudo, Disciplina } from '../types';

interface StudyEfficiencyProps {
    sessoes: SessaoEstudo[];
    disciplinas: Disciplina[];
}

interface EfficiencyData {
    nome: string;
    horasEstudadas: number;
    acerto: number;
    totalQuestoes: number;
    efficiency: 'alta' | 'media' | 'baixa';
    recommendation: string;
}

export const StudyEfficiency: React.FC<StudyEfficiencyProps> = ({ sessoes, disciplinas }) => {
    const data = useMemo(() => {
        const discData = new Map<string, { horas: number; certas: number; erradas: number }>();

        sessoes.forEach(s => {
            const disc = disciplinas.find(d => d.topicos.some(t => t.id === s.topico_id));
            if (!disc) return;

            const current = discData.get(disc.nome) || { horas: 0, certas: 0, erradas: 0 };
            current.horas += s.tempo_estudado / 3600; // to hours
            current.certas += s.questoes_certas || 0;
            current.erradas += s.questoes_erradas || 0;
            discData.set(disc.nome, current);
        });

        const result: EfficiencyData[] = [];
        discData.forEach((stats, nome) => {
            const totalQ = stats.certas + stats.erradas;
            if (totalQ < 5 || stats.horas < 0.5) return;

            const acerto = Math.round((stats.certas / totalQ) * 100);
            const questoesPorHora = totalQ / stats.horas;

            let efficiency: 'alta' | 'media' | 'baixa';
            let recommendation: string;

            if (acerto >= 80 && questoesPorHora >= 15) {
                efficiency = 'alta';
                recommendation = 'Rendimento excelente. Mantenha o ritmo ou avance para tópicos mais complexos.';
            } else if (acerto >= 70 && questoesPorHora >= 10) {
                efficiency = 'media';
                recommendation = 'Bom aproveitamento. Foque em resolver mais questões para consolidar.';
            } else if (acerto >= 70 && questoesPorHora < 10) {
                efficiency = 'media';
                recommendation = 'Acerto bom, mas resolução lenta. Pratique com tempo cronometrado.';
            } else if (acerto < 60) {
                efficiency = 'baixa';
                recommendation = 'Revise a teoria antes de continuar com questões. Foque nos conceitos fundamentais.';
            } else {
                efficiency = 'media';
                recommendation = 'Aproveitamento regular. Identifique os subtemas que mais erra e estude-os especificamente.';
            }

            result.push({
                nome,
                horasEstudadas: Math.round(stats.horas * 10) / 10,
                acerto,
                totalQuestoes: totalQ,
                efficiency,
                recommendation,
            });
        });

        return result.sort((a, b) => {
            const order = { baixa: 0, media: 1, alta: 2 };
            return order[a.efficiency] - order[b.efficiency];
        });
    }, [sessoes, disciplinas]);

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-3">
                <p className="text-sm text-muted-foreground">Estude e resolva questões em pelo menos uma disciplina para ver a análise de eficiência.</p>
            </div>
        );
    }

    const effConfig = {
        alta: {
            label: 'Alta',
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-700 dark:text-emerald-400',
            bar: 'bg-emerald-500',
        },
        media: {
            label: 'Média',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-400',
            bar: 'bg-amber-500',
        },
        baixa: {
            label: 'Baixa',
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-400',
            bar: 'bg-red-500',
        },
    };

    return (
        <div className="space-y-3">
            {data.map((d, i) => {
                const config = effConfig[d.efficiency];
                return (
                    <div key={i} className="p-4 rounded-xl border border-border bg-card/50 hover:bg-muted/20 transition-colors space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <h4 className="text-sm font-semibold text-foreground truncate" title={d.nome}>
                                    {d.nome}
                                </h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                                    {config.label}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-lg font-bold text-foreground">{d.acerto}%</div>
                                <div className="text-[10px] text-muted-foreground">Acerto</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-foreground">{d.horasEstudadas}h</div>
                                <div className="text-[10px] text-muted-foreground">Estudadas</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-foreground">{d.totalQuestoes}</div>
                                <div className="text-[10px] text-muted-foreground">Questões</div>
                            </div>
                        </div>

                        {/* Accuracy bar */}
                        <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${config.bar} transition-all duration-500`}
                                style={{ width: `${d.acerto}%` }}
                            />
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {d.recommendation}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};
