import React from 'react';
import { Card } from './ui/Card';
import { HistoricoItem } from '../stores/useHistoricoStore';
import { ClockIcon, CalendarDaysIcon, EditIcon, Trash2Icon, FileTextIcon } from './icons';

interface HistoricoSessoesProps {
    historico: HistoricoItem[];
    onEdit: (registro: HistoricoItem) => void;
    onDelete: (id: string, type: 'estudo' | 'simulado', name: string) => void;
}

const HistoricoSessoes: React.FC<HistoricoSessoesProps> = ({ historico, onEdit, onDelete }) => {
    const formatDataCompleta = (data: string) => {
<<<<<<< HEAD
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
=======
        const date = new Date(`${data}T00:00:00`);
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        if (date.toDateString() === hoje.toDateString()) return 'Hoje';
        if (date.toDateString() === ontem.toDateString()) return 'Ontem';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    };

    const formatarTempo = (minutos: number) => {
        if (!minutos) return '0min';
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        return h > 0 ? `${h}h ${m}min` : `${m}min`;
    };

    const getOrigemBadge = (origem: string | undefined) => {
<<<<<<< HEAD
        const badges: Record<string, string> = {
            manual: "text-blue-600 dark:text-blue-400",
            timer: "text-cyan-600 dark:text-cyan-400",
            ciclo_estudos: "text-emerald-600 dark:text-emerald-400",
            trilha: "text-amber-600 dark:text-amber-400"
        };
        return badges[origem as string] || badges.manual;
    };

    const getOrigemLabel = (origem: string | undefined) => {
        if (origem === 'ciclo_estudos') return 'Ciclo';
        if (origem === 'trilha') return 'Trilha';
        if (origem === 'timer') return 'Timer';
        return 'Manual';
=======
        const badges = {
            manual: "bg-blue-500/10 text-blue-400",
            timer: "bg-purple-500/10 text-purple-400",
            ciclo_estudos: "bg-green-500/10 text-green-400"
        };
        return badges[origem as keyof typeof badges] || badges.manual;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    };

    const historicoAgrupado = historico.reduce((acc, item) => {
        const dataKey = item.data.split('T')[0];
        if (!acc[dataKey]) acc[dataKey] = [];
        acc[dataKey].push(item);
        return acc;
    }, {} as Record<string, HistoricoItem[]>);

    const datasOrdenadas = Object.keys(historicoAgrupado).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
<<<<<<< HEAD
        <div className="space-y-8">
            {datasOrdenadas.map((data) => {
                const itensDoDia = historicoAgrupado[data];
                const tempoTotalDia = itensDoDia.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);

                return (
                    <div key={data} className="space-y-3">
                        {/* Header do Dia */}
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div className="flex items-center gap-2 text-foreground">
                                <CalendarDaysIcon className="w-4 h-4 text-primary" />
                                <span className="font-bold capitalize text-base">
                                    {formatDataCompleta(data)}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    · {itensDoDia.length} {itensDoDia.length === 1 ? 'atividade' : 'atividades'}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                <ClockIcon className="w-4 h-4 text-muted-foreground" />
                                <span>{formatarTempo(tempoTotalDia)}</span>
                            </div>
                        </div>

                        {/* Lista de Cards */}
                        <div className="space-y-3">
                            {itensDoDia.map((item) => (
                                <Card key={item.id} className="py-3 px-4 hover:shadow-md transition-shadow duration-200 border-border bg-card group">
                                    {item.type === 'estudo' ? (
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                {/* Linha 1: Disciplina • Tópico */}
                                                <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {item.disciplina}
                                                    </span>
                                                    {item.topico && (
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
                                                    <span className={`font-medium ${getOrigemBadge(item.origem)}`}>
                                                        {getOrigemLabel(item.origem)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ações */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
                                                <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-primary/10 transition-colors" title="Editar">
                                                    <EditIcon className="w-3.5 h-3.5 text-primary" />
                                                </button>
                                                <button onClick={() => onDelete(item.id, 'estudo', item.disciplina || 'Estudo')} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Excluir">
                                                    <Trash2Icon className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Card de Simulado
                                        <div className="space-y-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FileTextIcon className="w-4 h-4 text-purple-500" />
                                                        <span className="text-sm font-bold text-foreground">{item.nome}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <ClockIcon className="w-3.5 h-3.5" />
                                                        <span>{formatarTempo(item.duracao_minutos)}</span>
                                                        <span>·</span>
                                                        <span className={item.precisao !== undefined && item.precisao >= 70 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                                                            {item.precisao}% precisão
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 self-center">
                                                    <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-primary/10 transition-colors" title="Editar">
                                                        <EditIcon className="w-3.5 h-3.5 text-primary" />
                                                    </button>
                                                    <button onClick={() => onDelete(item.id, 'simulado', item.nome || 'Simulado')} className="p-1.5 rounded hover:bg-red-500/10 transition-colors" title="Excluir">
                                                        <Trash2Icon className="w-3.5 h-3.5 text-red-500" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stats do Simulado */}
                                            {(item.acertos !== undefined || item.erros !== undefined || item.brancos !== undefined) && (
                                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                                                    <div className="flex flex-col items-center p-1 rounded bg-emerald-500/5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-medium">Acertos</span>
                                                        <span className="text-sm font-bold text-emerald-600">{item.acertos || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-1 rounded bg-red-500/5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-medium">Erros</span>
                                                        <span className="text-sm font-bold text-red-500">{item.erros || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-1 rounded bg-yellow-500/5">
                                                        <span className="text-[10px] uppercase text-muted-foreground font-medium">Brancos</span>
                                                        <span className="text-sm font-bold text-yellow-600">{item.brancos || 0}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
=======
        <div className="space-y-6">
            {datasOrdenadas.map((data) => {
                const itensDoDia = historicoAgrupado[data];
                const tempoTotalDia = itensDoDia.reduce((acc, item) => acc + (item.duracao_minutos || 0), 0);
                return (
                    <div key={data} className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10"><CalendarDaysIcon className="w-4 h-4 text-primary" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground capitalize">{formatDataCompleta(data)}</h3>
                                    <p className="text-xs text-muted-foreground">{itensDoDia.length} {itensDoDia.length === 1 ? 'atividade' : 'atividades'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                                <ClockIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-bold text-foreground">{formatarTempo(tempoTotalDia)}</span>
                            </div>
                        </div>
                        <div className="grid gap-3">
                            {itensDoDia.map((item) => (
                                <Card key={item.id} className="p-4 hover:shadow-md transition-all border-border bg-card/50 group">
                                    {item.type === 'estudo' ? (
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="font-semibold text-lg text-foreground">{item.disciplina}</p>
                                                <p className="text-sm text-muted-foreground">{item.topico || 'Sem tópico'}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                    <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-muted-foreground" /><span className="text-lg font-bold text-foreground">{formatarTempo(item.duracao_minutos)}</span></div>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getOrigemBadge(item.origem)}`}>{item.origem === 'ciclo_estudos' ? 'Ciclo' : item.origem?.charAt(0).toUpperCase() + item.origem?.slice(1)}</span>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onEdit(item)} className="p-2 rounded-lg text-primary hover:bg-primary/10" title="Editar"><EditIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => onDelete(item.id, 'estudo', item.disciplina || 'Estudo')} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Excluir"><Trash2Icon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : ( // Simulado
                                        <>
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <FileTextIcon className="w-4 h-4 text-secondary" />
                                                        <p className="font-semibold text-lg text-foreground">{item.nome}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">Simulado</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                                        <div className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-muted-foreground" /><span className="text-lg font-bold text-foreground">{formatarTempo(item.duracao_minutos)}</span></div>
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-secondary/20 text-secondary">{item.precisao}% Acertos</span>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => onEdit(item)} className="p-2 rounded-lg text-primary hover:bg-primary/10" title="Editar"><EditIcon className="w-4 h-4" /></button>
                                                        <button onClick={() => onDelete(item.id, 'simulado', item.nome || 'Simulado')} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10" title="Excluir"><Trash2Icon className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-border text-xs grid grid-cols-3 gap-2 text-center">
                                                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded font-semibold">Acertos: {item.acertos}</div>
                                                <div className="p-1.5 bg-red-500/10 text-red-400 rounded font-semibold">Erros: {item.erros}</div>
                                                <div className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded font-semibold">Brancos: {item.brancos}</div>
                                            </div>
                                        </>
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HistoricoSessoes;
