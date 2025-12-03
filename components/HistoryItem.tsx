import React from 'react';
import { Card } from './ui/Card';
import { HistoricoItem } from '../stores/useHistoricoStore';
import { ClockIcon, EditIcon, Trash2Icon, FileTextIcon } from './icons';

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
        if (type === 'simulado') return 'text-secondary';
        if (origem === 'ciclo_estudos') return 'text-green-500';
        if (origem === 'trilha') return 'text-orange-500';
        if (origem === 'timer') return 'text-purple-500';
        return 'text-blue-500';
    };

    return (
        <Card className="p-3 hover:shadow-md transition-all duration-200 border-border bg-card group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {/* Linha 1: Disciplina • Tópico */}
                    <div className="flex items-center gap-2 mb-1">
                        {item.type === 'simulado' && (
                            <FileTextIcon className="w-4 h-4 text-secondary flex-shrink-0" />
                        )}
                        <h4 className="text-sm font-semibold text-foreground truncate">
                            {item.type === 'estudo' ? (
                                <>
                                    {item.disciplina}
                                    {item.topico && (
                                        <>
                                            <span className="text-muted-foreground mx-1.5">•</span>
                                            <span className="font-normal text-muted-foreground">{item.topico}</span>
                                        </>
                                    )}
                                </>
                            ) : (
                                item.nome
                            )}
                        </h4>
                    </div>

                    {/* Linha 2: Tempo · Tipo */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span className="font-semibold">{formatarTempo(item.duracao_minutos)}</span>
                        </div>
                        <span>·</span>
                        <span className={`font-medium ${getOrigemColor(item.origem, item.type)}`}>
                            {getOrigemLabel(item.origem, item.type)}
                        </span>
                        {item.type === 'simulado' && item.precisao !== undefined && (
                            <>
                                <span>·</span>
                                <span className="font-medium">{item.precisao}% acertos</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Botões de ação (aparecem no hover) */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        title="Editar"
                    >
                        <EditIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() =>
                            onDelete(
                                item.id,
                                item.type,
                                item.type === 'estudo' ? item.disciplina || 'Estudo' : item.nome || 'Simulado'
                            )
                        }
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                    >
                        <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </Card>
    );
};

export default HistoryItem;
