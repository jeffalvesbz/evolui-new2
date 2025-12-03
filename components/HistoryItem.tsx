import React from 'react';
import { Card } from './ui/Card';
import { HistoricoItem } from '../stores/useHistoricoStore';
import { ClockIcon, EditIcon, Trash2Icon } from './icons';

interface HistoryItemProps {
    item: HistoricoItem;
    onEdit: (registro: HistoricoItem) => void;
    onDelete: (id: string, type: 'estudo' | 'simulado', name: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ item, onEdit, onDelete }) => {
    const formatarTempo = (minutos: number) => {
        if (!minutos) return '0min';
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    };

    const getOrigemLabel = (origem: string | undefined, type: string) => {
        if (type === 'simulado') return 'Simulado';
        if (origem === 'ciclo_estudos') return 'Ciclo';
        if (origem === 'trilha') return 'Trilha';
        if (origem === 'timer') return 'Timer';
        if (origem === 'manual') return 'Manual';
        return 'Estudo';
    };

    const getOrigemColor = (origem: string | undefined, type: string) => {
        if (type === 'simulado') return 'text-purple-600 dark:text-purple-400';
        if (origem === 'ciclo_estudos') return 'text-emerald-600 dark:text-emerald-400';
        if (origem === 'trilha') return 'text-amber-600 dark:text-amber-400';
        if (origem === 'timer') return 'text-cyan-600 dark:text-cyan-400';
        return 'text-blue-600 dark:text-blue-400';
    };

    return (
        <Card className="py-3 px-4 hover:shadow-md transition-shadow duration-200 border-border bg-card group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {/* Linha 1: Disciplina • Tópico */}
                    <div className="flex items-center flex-wrap gap-1.5 mb-1">
                        <span className="text-sm font-bold text-foreground">
                            {item.type === 'estudo' ? item.disciplina : item.nome}
                        </span>
                        {item.type === 'estudo' && item.topico && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-sm text-muted-foreground truncate">
                                    {item.topico}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Linha 2: Tempo · Tipo */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatarTempo(item.duracao_minutos)}</span>
                        <span>·</span>
                        <span className={`font-medium ${getOrigemColor(item.origem, item.type)}`}>
                            {getOrigemLabel(item.origem, item.type)}
                        </span>
                        {item.type === 'simulado' && item.precisao !== undefined && (
                            <>
                                <span>·</span>
                                <span className={item.precisao >= 70 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                                    {item.precisao}%
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Botões de ação (aparecem no hover) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded hover:bg-primary/10 transition-colors"
                        title="Editar"
                    >
                        <EditIcon className="w-3.5 h-3.5 text-primary" />
                    </button>
                    <button
                        onClick={() =>
                            onDelete(
                                item.id,
                                item.type,
                                item.type === 'estudo' ? item.disciplina || 'Estudo' : item.nome || 'Simulado'
                            )
                        }
                        className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                    >
                        <Trash2Icon className="w-3.5 h-3.5 text-red-500" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default HistoryItem;
