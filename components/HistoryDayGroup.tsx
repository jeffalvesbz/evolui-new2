import React from 'react';
import { HistoricoItem } from '../stores/useHistoricoStore';
import HistoryItem from './HistoryItem';
import { CalendarDaysIcon, ClockIcon } from './icons';

interface HistoryDayGroupProps {
    data: string;
    items: HistoricoItem[];
    onEdit: (registro: HistoricoItem) => void;
    onDelete: (id: string, type: 'estudo' | 'simulado', name: string) => void;
    isToday?: boolean;
    allHistorico?: HistoricoItem[];
}

const HistoryDayGroup: React.FC<HistoryDayGroupProps> = ({
    data,
    items,
    onEdit,
    onDelete
}) => {
    const formatDataCompleta = (data: string) => {
        const [ano, mes, dia] = data.split('-').map(Number);
        const date = new Date(ano, mes - 1, dia);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const dateNormalizada = new Date(date);
        dateNormalizada.setHours(0, 0, 0, 0);

        if (dateNormalizada.getTime() === hoje.getTime()) return 'Hoje';
        if (dateNormalizada.getTime() === ontem.getTime()) return 'Ontem';
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    };

    const formatarTempo = (minutos: number) => {
        if (!minutos) return '0min';
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    };

    const tempoTotalDia = items.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);

    return (
        <div className="space-y-3">
            {/* Header do dia - Estilo da imagem */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2 text-foreground">
                    <CalendarDaysIcon className="w-4 h-4 text-primary" />
                    <span className="font-bold capitalize text-base">
                        {formatDataCompleta(data)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                        · {items.length} {items.length === 1 ? 'atividade' : 'atividades'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <ClockIcon className="w-4 h-4 text-muted-foreground" />
                    <span>{formatarTempo(tempoTotalDia)}</span>
                </div>
            </div>

            {/* Lista de itens */}
            <div className="space-y-3">
                {items.map((item) => (
                    <HistoryItem key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
                ))}
            </div>
        </div>
    );
};

export default HistoryDayGroup;
