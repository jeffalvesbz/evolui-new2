
import React, { useState, useMemo } from 'react';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { RepeatIcon, PlusIcon, EditIcon, Trash2Icon, SaveIcon, XIcon, ClockIcon, PlusCircleIcon, ArrowUpIcon, ArrowDownIcon, PlayIcon, StarIcon, CheckIcon, CheckCircle2Icon, GripVerticalIcon } from './icons';
import { toast } from './Sonner';
import { useModalStore } from '../stores/useModalStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Ciclo, SessaoCiclo } from '../types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper to format time
const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m > 0 ? `${m}min` : ''}`.trim();
    return `${m}min`;
};

const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#6366F1', '#F59E0B'];

// Componente de item sortable
const SortableSessaoItem: React.FC<{
    sessao: SessaoCiclo;
    index: number;
    isNext: boolean;
    isActive: boolean;
    disciplinaNome: string;
    tempoDecorrido?: number;
    onIniciar: () => void;
    onConcluir: () => void;
    onRemove: () => void;
    onUpdateTempo: (delta: number) => void;
}> = ({ sessao, index, isNext, isActive, disciplinaNome, tempoDecorrido, onIniciar, onConcluir, onRemove, onUpdateTempo }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: sessao.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-4 flex items-center justify-between group transition-colors ${isNext ? 'bg-primary/10 border-l-4 border-primary' : ''} ${isActive ? 'ring-2 ring-primary/50' : ''}`}
        >
            <div className="flex items-center gap-4 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                    <GripVerticalIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-bold bg-muted/50 w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground">{index + 1}</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{disciplinaNome}</p>
                        {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                Em andamento
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <ClockIcon className="w-3 h-3"/> {formatTime(sessao.tempo_previsto)}
                        </p>
                        {tempoDecorrido !== undefined && tempoDecorrido > 0 && (
                            <p className="text-xs text-primary font-medium">
                                {formatTime(tempoDecorrido)} decorridos
                            </p>
                        )}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onUpdateTempo(-5 * 60)}
                                className="text-xs px-1.5 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground"
                                title="Reduzir 5 min"
                            >
                                -5
                            </button>
                            <button
                                onClick={() => onUpdateTempo(5 * 60)}
                                className="text-xs px-1.5 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground"
                                title="Aumentar 5 min"
                            >
                                +5
                            </button>
                            <button
                                onClick={() => onUpdateTempo(10 * 60)}
                                className="text-xs px-1.5 py-0.5 rounded border border-border hover:bg-muted text-muted-foreground"
                                title="Aumentar 10 min"
                            >
                                +10
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isNext ? (
                    <>
                        <button
                            onClick={onIniciar}
                            className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-primary text-black text-xs font-bold shadow-sm hover:opacity-90"
                        >
                            <PlayIcon className="w-3 h-3"/> Iniciar
                        </button>
                        {isActive && (
                            <button
                                onClick={onConcluir}
                                className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-secondary text-black text-xs font-bold shadow-sm hover:opacity-90"
                            >
                                <CheckCircle2Icon className="w-3 h-3"/> Concluir
                            </button>
                        )}
                    </>
                ) : (
                    <button
                        onClick={onIniciar}
                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground text-xs font-bold shadow-sm hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <PlayIcon className="w-3 h-3"/>
                    </button>
                )}
                <button
                    onClick={onRemove}
                    className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2Icon className="w-4 h-4"/>
                </button>
            </div>
        </div>
    );
};

const CicloDeEstudos: React.FC = () => {
    const {
        ciclos,
        cicloAtivoId,
        getCicloAtivo,
        setCicloAtivoId,
        updateCiclo,
        removeCiclo,
        addSessaoAoCiclo,
        removeSessaoDoCiclo,
        ultimaSessaoConcluidaId,
        reordenarSessao,
        setUltimaSessaoConcluida,
    } = useCiclosStore();
    const { disciplinas } = useDisciplinasStore();
    const { iniciarSessao, sessaoAtual, sessoes } = useEstudosStore();
    const openCriarCicloModal = useModalStore(state => state.openCriarCicloModal);
    
    const [isEditingCiclo, setIsEditingCiclo] = useState(false);
    const [editedCicloName, setEditedCicloName] = useState('');
    const [isAddingSessao, setIsAddingSessao] = useState(false);
    const [novaSessaoData, setNovaSessaoData] = useState({ disciplinaId: '', tempoMinutos: '60' });
    const [isTrocarSessaoModalOpen, setIsTrocarSessaoModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const cicloAtivo = useMemo(() => getCicloAtivo(), [cicloAtivoId, ciclos, getCicloAtivo]);

    const disciplinasMap = useMemo<Map<string, string>>(() => new Map(disciplinas.map(d => [d.id, d.nome])), [disciplinas]);

    // Calcular sessões do ciclo concluídas hoje
    const sessoesHojeDoCiclo = useMemo(() => {
        if (!cicloAtivo) return [];
        const hojeISO = new Date().toISOString().split('T')[0];
        const sessoesIds = new Set((cicloAtivo.sessoes || []).map(s => s.id));
        return sessoes.filter(s => {
            if (s.data_estudo !== hojeISO) return false;
            // Verificar se a sessão pertence ao ciclo (através do topico_id que começa com 'ciclo-')
            return s.topico_id.startsWith('ciclo-') && sessoesIds.has(s.topico_id.replace('ciclo-', ''));
        });
    }, [sessoes, cicloAtivo]);

    // Calcular progresso do ciclo (tempo concluído vs total)
    const { totalTempoCiclo, tempoConcluidoCiclo, dadosGrafico, proximaSessao, progressoPercentual } = useMemo(() => {
        if (!cicloAtivo) return { totalTempoCiclo: 0, tempoConcluidoCiclo: 0, dadosGrafico: [], proximaSessao: null, progressoPercentual: 0 };
        
        const sessoesOrdenadas = [...(cicloAtivo.sessoes || [])].sort((a, b) => a.ordem - b.ordem);
        
        const tempoTotal = sessoesOrdenadas.reduce((acc: number, s) => acc + Number(s.tempo_previsto || 0), 0);
        
        // Calcular tempo concluído (sessões do ciclo que foram estudadas hoje)
        const tempoConcluido = sessoesHojeDoCiclo.reduce((acc, s) => acc + s.tempo_estudado, 0);
        
        const dadosGrafico = sessoesOrdenadas.map(sessao => ({
            name: disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida',
            value: Math.round(Number(sessao.tempo_previsto || 0) / 60)
        }));
        
        // Lógica para encontrar a próxima sessão
        let proxima: SessaoCiclo | null = null;
        if (sessoesOrdenadas.length > 0) {
            if (!ultimaSessaoConcluidaId) {
                proxima = sessoesOrdenadas[0];
            } else {
                const ultimoIndice = sessoesOrdenadas.findIndex(s => s.id === ultimaSessaoConcluidaId);
                proxima = sessoesOrdenadas[(ultimoIndice + 1) % sessoesOrdenadas.length];
            }
        }

        const progresso = tempoTotal > 0 ? Math.min(100, Math.round((tempoConcluido / tempoTotal) * 100)) : 0;

        return { totalTempoCiclo: tempoTotal, tempoConcluidoCiclo: tempoConcluido, dadosGrafico, proximaSessao: proxima, progressoPercentual: progresso };
    }, [cicloAtivo, disciplinasMap, ultimaSessaoConcluidaId, sessoesHojeDoCiclo]);

    // Verificar se há sessão ativa para a próxima sessão do ciclo
    const sessaoAtivaParaCiclo = useMemo(() => {
        if (!sessaoAtual || !proximaSessao) return null;
        const sessaoCicloId = `ciclo-${proximaSessao.id}`;
        return sessaoAtual.topico.id === sessaoCicloId ? sessaoAtual : null;
    }, [sessaoAtual, proximaSessao]);

    const handleUpdateCicloName = () => {
        if (cicloAtivo && editedCicloName.trim() && editedCicloName.trim() !== cicloAtivo.nome) {
            updateCiclo(cicloAtivo.id, { nome: editedCicloName.trim() });
            toast.success("Nome do ciclo atualizado.");
        }
        setIsEditingCiclo(false);
    }
    
    const handleRemoveCiclo = () => {
        if (cicloAtivo && window.confirm(`Tem certeza que deseja remover o ciclo "${cicloAtivo.nome}"?`)) {
            removeCiclo(cicloAtivo.id);
            toast.success("Ciclo removido.");
        }
    }
    
    const handleAddSessao = async () => {
        if (cicloAtivo && novaSessaoData.disciplinaId && parseInt(novaSessaoData.tempoMinutos) > 0) {
            await addSessaoAoCiclo(cicloAtivo.id, novaSessaoData.disciplinaId, parseInt(novaSessaoData.tempoMinutos) * 60);
            toast.success("Sessão adicionada ao ciclo.");
            setNovaSessaoData({ disciplinaId: '', tempoMinutos: '60' });
            setIsAddingSessao(false);
        } else {
            toast.error("Selecione uma disciplina e defina um tempo válido.");
        }
    };
    
    const handleIniciarEstudoCiclo = (sessao: SessaoCiclo) => {
        const disciplina = disciplinas.find(d => d.id === sessao.disciplina_id);
        if (disciplina && cicloAtivo) {
            iniciarSessao({
                id: `ciclo-${sessao.id}`,
                nome: disciplina.nome,
                disciplinaId: disciplina.id
            }, 'cronometro');
            toast.success(`Iniciando estudos de ${disciplina.nome}!`);
        }
    };

    const handleConcluirSessao = () => {
        if (!cicloAtivo || !proximaSessao || !sessaoAtivaParaCiclo) return;
        
        // Marcar sessão como concluída (isso vai avançar para a próxima)
        setUltimaSessaoConcluida(cicloAtivo.id, proximaSessao.id);
        toast.success("Sessão concluída! Avançando para a próxima.");
        
        // Sugerir revisão/flashcards
        const disciplina = disciplinas.find(d => d.id === proximaSessao.disciplina_id);
        if (disciplina) {
            setTimeout(() => {
                toast.info(`💡 Dica: Que tal revisar ${disciplina.nome} com flashcards?`, {
                    duration: 5000,
                });
            }, 1000);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        
        if (!cicloAtivo || !over || active.id === over.id) return;

        const sessoesOrdenadas = [...(cicloAtivo.sessoes || [])].sort((a, b) => a.ordem - b.ordem);
        const oldIndex = sessoesOrdenadas.findIndex(s => s.id === active.id);
        const newIndex = sessoesOrdenadas.findIndex(s => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const sessoesReordenadas = arrayMove(sessoesOrdenadas, oldIndex, newIndex);
        const sessoesComOrdem = sessoesReordenadas.map((s, i) => ({ ...s, ordem: i }));
        
        await updateCiclo(cicloAtivo.id, { sessoes: sessoesComOrdem });
        toast.success("Sessões reordenadas.");
    };

    const handleUpdateTempo = async (sessaoId: string, delta: number) => {
        if (!cicloAtivo) return;
        const sessao = cicloAtivo.sessoes?.find(s => s.id === sessaoId);
        if (!sessao) return;
        
        const novoTempo = Math.max(60, sessao.tempo_previsto + delta); // Mínimo de 1 minuto
        const sessoesAtualizadas = cicloAtivo.sessoes?.map(s => 
            s.id === sessaoId ? { ...s, tempo_previsto: novoTempo } : s
        );
        
        await updateCiclo(cicloAtivo.id, { sessoes: sessoesAtualizadas });
        toast.success(`Tempo atualizado para ${formatTime(novoTempo)}`);
    };

    const handleTrocarSessao = () => {
        setIsTrocarSessaoModalOpen(true);
    };

    const handleSelecionarSessao = (sessaoSelecionada: SessaoCiclo) => {
        if (!cicloAtivo) return;
        
        // Atualizar a última sessão concluída para a sessão anterior à selecionada
        // Isso faz com que a sessão selecionada se torne a nova "próxima sessão"
        const sessoesOrdenadas = [...(cicloAtivo.sessoes || [])].sort((a, b) => a.ordem - b.ordem);
        const indiceSelecionado = sessoesOrdenadas.findIndex(s => s.id === sessaoSelecionada.id);
        
        if (indiceSelecionado > 0) {
            // Se não é a primeira, marca a anterior como concluída
            const sessaoAnterior = sessoesOrdenadas[indiceSelecionado - 1];
            setUltimaSessaoConcluida(cicloAtivo.id, sessaoAnterior.id);
        } else {
            // Se é a primeira, limpa o estado (volta ao início do ciclo)
            setUltimaSessaoConcluida(cicloAtivo.id, sessoesOrdenadas[sessoesOrdenadas.length - 1].id);
        }
        
        handleIniciarEstudoCiclo(sessaoSelecionada);
        setIsTrocarSessaoModalOpen(false);
        toast.success(`Iniciando estudos de ${disciplinasMap.get(sessaoSelecionada.disciplina_id)}!`);
    };

    const sessoesOrdenadas = useMemo(() => {
        if (!cicloAtivo) return [];
        return [...(cicloAtivo.sessoes || [])].sort((a, b) => a.ordem - b.ordem);
    }, [cicloAtivo]);

    return (
        <div data-tutorial="ciclos-content" className="max-w-7xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><RepeatIcon className="w-8 h-8"/> Ciclos de Estudos</h1>
                    <p className="text-muted-foreground mt-1">Organize suas disciplinas em um ciclo rotativo para garantir um estudo equilibrado.</p>
                </div>
                <button onClick={openCriarCicloModal} className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <PlusCircleIcon className="w-4 h-4" />
                    Criar Novo Ciclo
                </button>
            </header>

            {/* CTA Fixo da Próxima Sessão */}
            {cicloAtivo && proximaSessao && (
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-primary uppercase">Próxima Sessão</span>
                                {sessaoAtivaParaCiclo && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/30 text-primary font-medium flex items-center gap-1">
                                        <ClockIcon className="w-3 h-3" />
                                        {formatTime(sessaoAtivaParaCiclo.elapsedSeconds)} em andamento
                                    </span>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-1">
                                {disciplinasMap.get(proximaSessao.disciplina_id)}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Tempo previsto: {formatTime(proximaSessao.tempo_previsto)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {!sessaoAtivaParaCiclo ? (
                                <button
                                    onClick={() => handleIniciarEstudoCiclo(proximaSessao)}
                                    className="h-12 px-6 flex items-center gap-2 rounded-lg bg-primary text-black text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Iniciar Agora
                                </button>
                            ) : (
                                <button
                                    onClick={handleConcluirSessao}
                                    className="h-12 px-6 flex items-center gap-2 rounded-lg bg-secondary text-black text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                                >
                                    <CheckCircle2Icon className="w-4 h-4" />
                                    Concluir Sessão
                                </button>
                            )}
                            <button
                                onClick={handleTrocarSessao}
                                className="h-12 px-4 flex items-center gap-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Trocar Sessão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <label htmlFor="ciclo-select" className="text-sm font-medium text-muted-foreground mb-1 block">Ciclo Ativo</label>
                <select
                    id="ciclo-select"
                    value={cicloAtivoId || ''}
                    onChange={(e) => setCicloAtivoId(e.target.value)}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary"
                >
                    {ciclos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
            </div>

            {cicloAtivo ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm">
                        <header className="p-4 border-b border-border flex items-center justify-between">
                            {isEditingCiclo ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        value={editedCicloName}
                                        onChange={(e) => setEditedCicloName(e.target.value)}
                                        className="bg-input border border-border rounded-md px-3 py-1.5 text-lg font-bold text-foreground"
                                        autoFocus
                                        onBlur={handleUpdateCicloName}
                                        onKeyDown={e => e.key === 'Enter' && handleUpdateCicloName()}
                                    />
                                    <button onClick={handleUpdateCicloName} className="p-2 rounded-md hover:bg-muted"><SaveIcon className="w-4 h-4 text-primary"/></button>
                                </div>
                            ) : (
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    {cicloAtivo.nome}
                                    <button onClick={() => { setIsEditingCiclo(true); setEditedCicloName(cicloAtivo.nome); }} className="p-1.5 text-muted-foreground hover:text-primary"><EditIcon className="w-4 h-4"/></button>
                                </h2>
                            )}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="font-bold text-foreground">{formatTime(totalTempoCiclo)}</p>
                                    <p className="text-xs text-muted-foreground">Tempo total</p>
                                </div>
                                <button onClick={handleRemoveCiclo} className="p-2 text-muted-foreground hover:text-red-500"><Trash2Icon className="w-4 h-4"/></button>
                            </div>
                        </header>

                        {/* Barra de Progresso e Badge */}
                        <div className="p-4 border-b border-border bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-muted-foreground">Progresso do Ciclo</span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-bold">
                                        {sessoesHojeDoCiclo.length} sessão{sessoesHojeDoCiclo.length !== 1 ? 'ões' : ''} hoje
                                    </span>
                                </div>
                                <span className="text-sm font-bold text-foreground">{progressoPercentual}%</span>
                            </div>
                            <div className="w-full bg-muted/50 rounded-full h-2.5">
                                <div
                                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${progressoPercentual}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>{formatTime(tempoConcluidoCiclo)} concluído</span>
                                <span>{formatTime(totalTempoCiclo)} total</span>
                            </div>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={sessoesOrdenadas.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
                                    {sessoesOrdenadas.map((sessao, index) => {
                                        const isNext = sessao.id === proximaSessao?.id;
                                        const isActive = sessaoAtivaParaCiclo?.topico.id === `ciclo-${sessao.id}`;
                                        const tempoDecorrido = isActive ? sessaoAtivaParaCiclo.elapsedSeconds : undefined;
                                        
                                        return (
                                            <SortableSessaoItem
                                                key={sessao.id}
                                                sessao={sessao}
                                                index={index}
                                                isNext={isNext}
                                                isActive={isActive}
                                                disciplinaNome={disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida'}
                                                tempoDecorrido={tempoDecorrido}
                                                onIniciar={() => handleIniciarEstudoCiclo(sessao)}
                                                onConcluir={handleConcluirSessao}
                                                onRemove={() => removeSessaoDoCiclo(cicloAtivo.id, sessao.id)}
                                                onUpdateTempo={(delta) => handleUpdateTempo(sessao.id, delta)}
                                            />
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                            
                        {isAddingSessao && (
                            <div className="p-4 bg-muted/20 flex items-end gap-3 border-t border-border">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Disciplina</label>
                                    <select
                                        value={novaSessaoData.disciplinaId}
                                        onChange={e => setNovaSessaoData({...novaSessaoData, disciplinaId: e.target.value})}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                                    >
                                        <option value="">Selecione...</option>
                                        {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Tempo (min)</label>
                                    <input
                                        type="number"
                                        value={novaSessaoData.tempoMinutos}
                                        onChange={e => setNovaSessaoData({...novaSessaoData, tempoMinutos: e.target.value})}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                                    />
                                </div>
                                <button onClick={handleAddSessao} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm">Adicionar</button>
                                <button onClick={() => setIsAddingSessao(false)} className="h-10 w-10 rounded-lg border border-border text-muted-foreground hover:bg-muted"><XIcon className="w-4 h-4 mx-auto"/></button>
                            </div>
                        )}
                        {!isAddingSessao && (
                            <div className="p-4 border-t border-border">
                                <button onClick={() => setIsAddingSessao(true)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-primary font-medium text-sm hover:bg-primary/10">
                                    <PlusIcon className="w-4 h-4"/> Adicionar Sessão de Estudo
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="bg-card rounded-xl border border-border shadow-sm p-4 space-y-4">
                        <h3 className="font-bold text-center text-foreground">Distribuição do Tempo</h3>
                        {dadosGrafico.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={dadosGrafico} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5}>
                                        {dadosGrafico.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)'}} formatter={(value: number) => `${value} min`}/>
                                    <Legend iconSize={10} wrapperStyle={{fontSize: '0.8rem', paddingTop: '10px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Adicione sessões para ver o gráfico.</div>
                        )}
                        {proximaSessao && (
                             <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                                <p className="text-xs font-bold text-primary mb-1">PRÓXIMA SESSÃO</p>
                                <p className="font-semibold text-lg text-foreground">{disciplinasMap.get(proximaSessao.disciplina_id)}</p>
                                <p className="text-sm text-muted-foreground">{formatTime(proximaSessao.tempo_previsto)}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
                    <RepeatIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">Nenhum ciclo de estudos criado</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Comece a organizar seus estudos de forma mais eficiente.</p>
                    <button onClick={openCriarCicloModal} className="h-11 px-6 flex items-center mx-auto gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        <PlusCircleIcon className="w-5 h-5" />
                        Criar meu primeiro ciclo
                    </button>
                </div>
            )}

            {/* Modal de Trocar Sessão */}
            {isTrocarSessaoModalOpen && cicloAtivo && (
                <div 
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setIsTrocarSessaoModalOpen(false)}
                >
                    <div 
                        className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <header className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RepeatIcon className="w-6 h-6 text-primary" />
                                <h2 className="text-lg font-bold">Trocar Sessão de Estudo</h2>
                            </div>
                            <button 
                                onClick={() => setIsTrocarSessaoModalOpen(false)}
                                className="p-1.5 rounded-full hover:bg-muted"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </header>

                        <main className="p-6 max-h-[70vh] overflow-y-auto">
                            <p className="text-sm text-muted-foreground mb-4">
                                Selecione qual disciplina deseja estudar agora:
                            </p>
                            
                            <div className="space-y-2">
                                {sessoesOrdenadas.map((sessao, index) => {
                                    const disciplinaNome = disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida';
                                    const isProxima = sessao.id === proximaSessao?.id;
                                    const isActive = sessaoAtivaParaCiclo?.topico.id === `ciclo-${sessao.id}`;
                                    
                                    return (
                                        <button
                                            key={sessao.id}
                                            onClick={() => handleSelecionarSessao(sessao)}
                                            disabled={isActive}
                                            className={`w-full p-4 rounded-lg border transition-all text-left ${
                                                isActive
                                                    ? 'bg-muted/50 border-muted cursor-not-allowed opacity-60'
                                                    : isProxima
                                                    ? 'bg-primary/10 border-primary hover:bg-primary/20'
                                                    : 'bg-background border-border hover:bg-muted/50 hover:border-primary/50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${
                                                        isProxima 
                                                            ? 'bg-primary text-black' 
                                                            : 'bg-muted/50 text-muted-foreground'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{disciplinaNome}</p>
                                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                                            <ClockIcon className="w-3 h-3" />
                                                            {formatTime(sessao.tempo_previsto)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isProxima && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                                                            Próxima
                                                        </span>
                                                    )}
                                                    {isActive && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-primary/30 text-primary font-medium flex items-center gap-1">
                                                            <ClockIcon className="w-3 h-3" />
                                                            Em andamento
                                                        </span>
                                                    )}
                                                    {!isActive && (
                                                        <PlayIcon className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </main>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CicloDeEstudos;
