import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { RepeatIcon, PlusIcon, EditIcon, Trash2Icon, SaveIcon, XIcon, ClockIcon, PlusCircleIcon, ArrowUpIcon, ArrowDownIcon, PlayIcon, StarIcon, CheckIcon, CheckCircle2Icon, GripVerticalIcon, SearchIcon } from './icons';
import { toast } from './Sonner';
import { useModalStore } from '../stores/useModalStore';
import { useUiStore } from '../stores/useUiStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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

// Tooltip customizado para o gráfico de distribuição de tempo
const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0];
    return (
        <div
            className="recharts-custom-tooltip"
            style={{
                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '0.75rem',
                padding: '12px 16px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                minWidth: '150px',
            }}
        >
            <p style={{
                color: '#ffffff',
                margin: '0 0 8px 0',
                fontWeight: 600,
                fontSize: '0.875rem',
                lineHeight: '1.25rem',
            }}>
                {data.name}
            </p>
            <p style={{
                color: '#e2e8f0',
                margin: '0',
                fontSize: '0.875rem',
                opacity: 0.9,
            }}>
                {`${data.value} min`}
            </p>
        </div>
    );
};

// Componente de item sortable
const SortableSessaoItemComponent: React.FC<{
    sessao: SessaoCiclo;
    index: number;
    isNext: boolean;
    isActive: boolean;
    disciplinaNome: string;
    tempoDecorrido?: number;
    isConcluido: boolean;
    isParcial?: boolean;
    tempoFaltante?: number;
    isSaving?: boolean;
    onIniciar: () => void;
    onConcluir: () => void;
    onRemove: () => void;
    onUpdateTempo: (delta: number) => void;
}> = ({ sessao, index, isNext, isActive, disciplinaNome, tempoDecorrido, isConcluido, isParcial = false, tempoFaltante, isSaving = false, onIniciar, onConcluir, onRemove, onUpdateTempo }) => {
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
            className={`p-4 flex items-center justify-between group transition-all duration-300 ${isConcluido
                ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                : isParcial
                    ? 'bg-orange-50/50 dark:bg-orange-900/10 border-l-4 border-orange-400'
                    : isNext
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : ''
                } ${isActive ? 'ring-2 ring-primary/50' : ''}`}
        >
            <div className="flex items-center gap-4 flex-1">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
                    <GripVerticalIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${isConcluido
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : isParcial
                        ? 'bg-orange-400 dark:bg-orange-500 text-white'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}>
                    {isConcluido ? <CheckCircle2Icon className="w-4 h-4" /> : isParcial ? <ClockIcon className="w-4 h-4" /> : index + 1}
                </span>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className={`font-semibold transition-all duration-300 ${isConcluido
                            ? 'text-green-600 dark:text-green-400 line-through'
                            : isParcial
                                ? 'text-orange-500 dark:text-orange-400'
                                : 'text-foreground'
                            }`}>
                            {disciplinaNome}
                        </p>
                        <AnimatePresence>
                            {isConcluido && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-medium flex items-center gap-1"
                                >
                                    <CheckCircle2Icon className="w-3 h-3" />
                                    Concluída
                                </motion.span>
                            )}
                            {isParcial && tempoFaltante !== undefined && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="text-xs px-2 py-0.5 rounded-full bg-orange-100/70 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1"
                                >
                                    <ClockIcon className="w-3 h-3" />
                                    Faltam {formatTime(tempoFaltante)}
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {isActive && !isConcluido && !isParcial && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex items-center gap-1">
                                <ClockIcon className="w-3 h-3" />
                                Em andamento
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" /> {formatTime(sessao.tempo_previsto)}
                        </p>
                        {tempoDecorrido !== undefined && tempoDecorrido > 0 && (
                            <p className="text-xs text-primary font-medium">
                                {formatTime(tempoDecorrido)} decorridos
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {!isConcluido && (
                    <button
                        onClick={onIniciar}
                        aria-label={`Iniciar sessão de ${disciplinaNome}`}
                        className={`h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-opacity ${isNext
                            ? 'bg-primary text-black'
                            : isParcial
                                ? 'bg-orange-400 text-white'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }`}
                    >
                        <PlayIcon className="w-3 h-3" /> {isParcial ? 'Continuar' : 'Iniciar'}
                    </button>
                )}
                {isActive && (
                    <button
                        onClick={onConcluir}
                        disabled={isSaving || isConcluido}
                        aria-label={isConcluido ? `Sessão de ${disciplinaNome} já concluída` : `Concluir sessão de ${disciplinaNome}`}
                        className={`h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${isConcluido
                            ? 'bg-green-500 text-white'
                            : 'bg-secondary text-black'
                            }`}
                    >
                        {isSaving ? (
                            <>
                                <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                Salvando...
                            </>
                        ) : isConcluido ? (
                            <>
                                <CheckCircle2Icon className="w-3 h-3" /> Concluída
                            </>
                        ) : (
                            <>
                                <CheckCircle2Icon className="w-3 h-3" /> Concluir
                            </>
                        )}
                    </button>
                )}
                <button
                    onClick={onRemove}
                    aria-label={`Remover sessão de ${disciplinaNome}`}
                    className="p-2 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2Icon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// Memoizar componente para evitar re-renders desnecessários
const SortableSessaoItem = React.memo(SortableSessaoItemComponent, (prevProps, nextProps) => {
    return (
        prevProps.sessao.id === nextProps.sessao.id &&
        prevProps.sessao.tempo_previsto === nextProps.sessao.tempo_previsto &&
        prevProps.index === nextProps.index &&
        prevProps.isNext === nextProps.isNext &&
        prevProps.isActive === nextProps.isActive &&
        prevProps.isConcluido === nextProps.isConcluido &&
        prevProps.isParcial === nextProps.isParcial &&
        prevProps.tempoFaltante === nextProps.tempoFaltante &&
        prevProps.tempoDecorrido === nextProps.tempoDecorrido &&
        prevProps.disciplinaNome === nextProps.disciplinaNome &&
        prevProps.isSaving === nextProps.isSaving
    );
});

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
    const { iniciarSessao, sessaoAtual, sessoes, salvarSessao, descartarSessao, encerrarSessaoParaSalvar } = useEstudosStore();
    const openCriarCicloModal = useModalStore(state => state.openCriarCicloModal);
    const { planType, canCreateCiclo, getMaxCiclos } = useSubscriptionStore();

    const maxCiclos = getMaxCiclos();
    const ciclosCriados = ciclos.length;
    const podeCriarCiclo = canCreateCiclo();

    const [isEditingCiclo, setIsEditingCiclo] = useState(false);
    const [editedCicloName, setEditedCicloName] = useState('');
    const [isAddingSessao, setIsAddingSessao] = useState(false);
    const [novaSessaoData, setNovaSessaoData] = useState({ disciplinaId: '', tempoMinutos: '60' });
    const [isTrocarSessaoModalOpen, setIsTrocarSessaoModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [buscaDisciplina, setBuscaDisciplina] = useState('');
    const [mostrarConcluidas, setMostrarConcluidas] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Refs para scroll automático
    const sessaoRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const proximaSessaoRef = useRef<HTMLDivElement | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Calcular cicloAtivo diretamente sem usar getCicloAtivo na dependência
    const cicloAtivo = useMemo(() => {
        if (!cicloAtivoId) return null;
        return ciclos.find(c => c.id === cicloAtivoId) || null;
    }, [cicloAtivoId, ciclos]);

    const disciplinasMap = useMemo<Map<string, string>>(() => new Map(disciplinas.map(d => [d.id, d.nome])), [disciplinas]);

    // Criar sessoesIdsDoCiclo memoizado uma vez
    const sessoesIdsDoCiclo = useMemo(() => {
        if (!cicloAtivo) return new Set<string>();
        return new Set((cicloAtivo.sessoes || []).map(s => s.id));
    }, [cicloAtivo]);

    // Criar sessoesDoCiclo base que filtra todas as sessões do ciclo
    // Verifica tanto topico_id começando com 'ciclo-' quanto comentários com CICLO_SESSAO_ID
    const sessoesDoCiclo = useMemo(() => {
        if (sessoesIdsDoCiclo.size === 0) return [];
        return sessoes.filter(s => {
            // Verificar se topico_id começa com 'ciclo-'
            if (s.topico_id.startsWith('ciclo-')) {
                const sessaoCicloId = s.topico_id.replace('ciclo-', '');
                return sessoesIdsDoCiclo.has(sessaoCicloId);
            }
            // Verificar se há marcador CICLO_SESSAO_ID nos comentários
            if (s.comentarios) {
                const match = s.comentarios.match(/CICLO_SESSAO_ID:([^\s|]+)/);
                if (match && match[1]) {
                    const sessaoCicloId = match[1];
                    return sessoesIdsDoCiclo.has(sessaoCicloId);
                }
            }
            return false;
        });
    }, [sessoes, sessoesIdsDoCiclo]);

    // Calcular sessões do ciclo concluídas hoje (derivado de sessoesDoCiclo)
    const sessoesHojeDoCiclo = useMemo(() => {
        const hojeISO = new Date().toISOString().split('T')[0];
        return sessoesDoCiclo.filter(s => s.data_estudo === hojeISO);
    }, [sessoesDoCiclo]);

    // Criar Set com IDs de sessões concluídas (qualquer data)
    // Verifica tanto topico_id quanto comentários
    const sessoesConcluidasIds = useMemo(() => {
        const ids = new Set<string>();
        sessoesDoCiclo.forEach(s => {
            let sessaoCicloId: string | null = null;
            // Verificar se topico_id começa com 'ciclo-'
            if (s.topico_id.startsWith('ciclo-')) {
                sessaoCicloId = s.topico_id.replace('ciclo-', '');
            }
            // Verificar se há marcador CICLO_SESSAO_ID nos comentários
            else if (s.comentarios) {
                const match = s.comentarios.match(/CICLO_SESSAO_ID:([^\s|]+)/);
                if (match && match[1]) {
                    sessaoCicloId = match[1];
                }
            }
            if (sessaoCicloId) {
                ids.add(sessaoCicloId);
            }
        });
        return ids;
    }, [sessoesDoCiclo]);

    // todasSessoesDoCiclo é simplesmente sessoesDoCiclo (já são todas as sessões do ciclo)
    const todasSessoesDoCiclo = sessoesDoCiclo;

    // Calcular sessoesOrdenadas uma vez e reutilizar
    const sessoesOrdenadas = useMemo(() => {
        if (!cicloAtivo) return [];
        return [...(cicloAtivo.sessoes || [])].sort((a, b) => a.ordem - b.ordem);
    }, [cicloAtivo]);

    // Filtrar sessões por busca e mostrar/ocultar concluídas
    const sessoesFiltradas = useMemo(() => {
        let filtradas = sessoesOrdenadas;

        // Filtrar por busca de disciplina
        if (buscaDisciplina.trim()) {
            const buscaLower = buscaDisciplina.toLowerCase().trim();
            filtradas = filtradas.filter(sessao => {
                const nomeDisciplina = disciplinasMap.get(sessao.disciplina_id) || '';
                return nomeDisciplina.toLowerCase().includes(buscaLower);
            });
        }

        // Filtrar sessões concluídas
        if (!mostrarConcluidas) {
            filtradas = filtradas.filter(sessao => !sessoesConcluidasIds.has(sessao.id));
        }

        return filtradas;
    }, [sessoesOrdenadas, buscaDisciplina, mostrarConcluidas, sessoesConcluidasIds, disciplinasMap]);

    // Calcular progresso do ciclo (tempo concluído vs total)
    const { totalTempoCiclo, tempoConcluidoCiclo, dadosGrafico, proximaSessao, progressoPercentual, legendaDisciplinas, cicloConcluido, totalSessoes, sessoesConcluidasCount, tempoPorSessaoCiclo } = useMemo(() => {
        if (!cicloAtivo || sessoesOrdenadas.length === 0) return {
            totalTempoCiclo: 0,
            tempoConcluidoCiclo: 0,
            dadosGrafico: [],
            proximaSessao: null,
            progressoPercentual: 0,
            legendaDisciplinas: [],
            cicloConcluido: false,
            totalSessoes: 0,
            sessoesConcluidasCount: 0,
            tempoPorSessaoCiclo: new Map<string, number>()
        };

        const tempoTotal = sessoesOrdenadas.reduce((acc: number, s) => acc + Number(s.tempo_previsto || 0), 0);

        // Calcular tempo concluído considerando TODAS as sessões do ciclo estudadas (não apenas hoje)
        // Agrupar por sessão do ciclo e SOMAR o tempo estudado de todas as sessões de estudo
        const tempoPorSessaoCiclo = new Map<string, number>();
        todasSessoesDoCiclo.forEach(s => {
            let sessaoCicloId: string | null = null;
            // Verificar se topico_id começa com 'ciclo-'
            if (s.topico_id.startsWith('ciclo-')) {
                sessaoCicloId = s.topico_id.replace('ciclo-', '');
            }
            // Verificar se há marcador CICLO_SESSAO_ID nos comentários
            else if (s.comentarios) {
                const match = s.comentarios.match(/CICLO_SESSAO_ID:([^\s|]+)/);
                if (match && match[1]) {
                    sessaoCicloId = match[1];
                }
            }
            if (sessaoCicloId) {
                const tempoAtual = tempoPorSessaoCiclo.get(sessaoCicloId) || 0;
                // SOMAR o tempo estudado de todas as sessões de estudo para a mesma sessão do ciclo
                tempoPorSessaoCiclo.set(sessaoCicloId, tempoAtual + s.tempo_estudado);
            }
        });

        // Identificar quais sessões estão concluídas (tempo estudado >= tempo previsto)
        const sessoesConcluidas = new Set<string>();
        todasSessoesDoCiclo.forEach(s => {
            let sessaoCicloId: string | null = null;
            // Verificar se topico_id começa com 'ciclo-'
            if (s.topico_id.startsWith('ciclo-')) {
                sessaoCicloId = s.topico_id.replace('ciclo-', '');
            }
            // Verificar se há marcador CICLO_SESSAO_ID nos comentários (múltiplos formatos possíveis)
            else if (s.comentarios) {
                // Tentar múltiplos padrões de regex para capturar o ID
                // O marcador pode estar no formato: "CICLO_SESSAO_ID:xxx" ou "texto | CICLO_SESSAO_ID:xxx"
                const patterns = [
                    /CICLO_SESSAO_ID:([^\s|]+)/,  // Padrão original (captura até espaço ou |)
                    /CICLO_SESSAO_ID:\s*([^\s|]+)/, // Com espaços opcionais após :
                    /CICLO_SESSAO_ID:([a-f0-9-]+)/i, // Apenas UUIDs (formato mais específico)
                    /CICLO_SESSAO_ID:([^\s|]+?)(?:\s*\||$)/, // Com separador | opcional no final
                ];

                for (const pattern of patterns) {
                    const match = s.comentarios.match(pattern);
                    if (match && match[1]) {
                        sessaoCicloId = match[1].trim();
                        break;
                    }
                }
            }
            if (sessaoCicloId && sessoesIdsDoCiclo.has(sessaoCicloId)) {
                // Verificar se o tempo estudado acumulado atingiu o tempo previsto
                const sessaoCiclo = sessoesOrdenadas.find(se => se.id === sessaoCicloId);
                if (sessaoCiclo) {
                    // Usar o tempo acumulado (soma de todas as sessões de estudo)
                    const tempoEstudadoAcumulado = tempoPorSessaoCiclo.get(sessaoCicloId) || 0;
                    const tempoPrevisto = sessaoCiclo.tempo_previsto || 0;
                    // Só considera concluída se o tempo estudado acumulado for >= tempo previsto
                    if (tempoEstudadoAcumulado >= tempoPrevisto) {
                        sessoesConcluidas.add(sessaoCicloId);
                    }
                }
            }
        });

        // Somar o tempo de cada sessão do ciclo (limitado ao tempo previsto)
        const tempoConcluido = sessoesOrdenadas.reduce((acc, sessao) => {
            const tempoEstudado = tempoPorSessaoCiclo.get(sessao.id) || 0;
            // Limitar ao tempo previsto para não ultrapassar 100%
            return acc + Math.min(tempoEstudado, sessao.tempo_previsto);
        }, 0);

        // Criar mapeamento estável de disciplina para cor (ordenado por nome para consistência)
        const disciplinasUnicas = Array.from(new Set(sessoesOrdenadas.map(s => s.disciplina_id)))
            .sort((a, b) => {
                const nomeA = disciplinasMap.get(a) || '';
                const nomeB = disciplinasMap.get(b) || '';
                return nomeA.localeCompare(nomeB);
            });
        const disciplinaCorMap = new Map<string, string>();
        disciplinasUnicas.forEach((disciplinaId: string, index: number) => {
            disciplinaCorMap.set(disciplinaId, COLORS[index % COLORS.length]);
        });

        // Calcular progresso por disciplina
        const progressoPorDisciplina = new Map<string, number>();
        disciplinasUnicas.forEach((disciplinaId: string) => {
            const sessoesDaDisciplina = sessoesOrdenadas.filter(s => s.disciplina_id === disciplinaId);
            const sessoesConcluidasDaDisciplina = sessoesDaDisciplina.filter(s => sessoesConcluidas.has(s.id));
            const progresso = sessoesDaDisciplina.length > 0
                ? sessoesConcluidasDaDisciplina.length / sessoesDaDisciplina.length
                : 0;
            progressoPorDisciplina.set(disciplinaId, progresso);
        });

        // Criar dados do gráfico com cores dinâmicas baseadas no estado de conclusão
        const dadosGrafico = sessoesOrdenadas.map(sessao => {
            const disciplinaId = sessao.disciplina_id;
            const nomeDisciplina = disciplinasMap.get(disciplinaId) || 'Desconhecida';
            const corBase = disciplinaCorMap.get(disciplinaId) || COLORS[0];
            const isConcluida = sessoesConcluidas.has(sessao.id);
            const progressoDisciplina = progressoPorDisciplina.get(disciplinaId) || 0;

            // Verificar se o tempo estudado atingiu o tempo previsto
            const tempoEstudadoSessao = tempoPorSessaoCiclo.get(sessao.id) || 0;
            const tempoPrevistoSessao = sessao.tempo_previsto || 0;

            // Uma sessão só é considerada concluída se o tempo estudado >= tempo previsto
            const sessaoEstaConcluida = isConcluida && tempoEstudadoSessao >= tempoPrevistoSessao;

            // Verificar se a sessão está parcialmente concluída (tempo estudado > 0 mas < tempo previsto)
            const sessaoEstaParcial = !sessaoEstaConcluida && tempoEstudadoSessao > 0 && tempoEstudadoSessao < tempoPrevistoSessao;

            // Determinar cor final:
            // - Cinza (#9CA3AF) se sessão concluída (independente do progresso da disciplina)
            // - Laranja suave (#FB923C) se sessão parcialmente concluída
            // - Cor base se não concluída
            let corFinal = corBase;
            if (sessaoEstaConcluida) {
                corFinal = '#9CA3AF'; // Cinza para sessão concluída
            } else if (sessaoEstaParcial) {
                corFinal = '#FB923C'; // Laranja suave (orange-400) para sessão parcialmente concluída
            }

            return {
                id: sessao.id,
                disciplinaId: disciplinaId,
                name: nomeDisciplina,
                value: Math.round(Number(sessao.tempo_previsto || 0) / 60),
                color: corFinal,
                corBase: corBase, // Guardar cor base para legenda
                isConcluida: sessaoEstaConcluida,
                progressoDisciplina: progressoDisciplina
            };
        });

        // Criar legenda única por disciplina (sem repetição)
        const legendaDisciplinas = disciplinasUnicas.map((disciplinaId: string) => {
            const nomeDisciplina = disciplinasMap.get(disciplinaId) || 'Desconhecida';
            const corBase = disciplinaCorMap.get(disciplinaId) || COLORS[0];
            const progressoDisciplina = progressoPorDisciplina.get(disciplinaId) || 0;

            // Cor da legenda: sempre usa a cor base (não verde)
            const corLegenda = corBase;

            return {
                disciplinaId,
                name: nomeDisciplina,
                color: corLegenda,
                progresso: progressoDisciplina
            };
        });

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

        // Calcular progresso: considerar 100% quando tempo concluído >= tempo total
        const progresso = tempoTotal > 0 ? Math.min(100, Math.round((tempoConcluido / tempoTotal) * 100)) : 0;

        // Garantir que seja exatamente 100% quando concluído (com margem de erro de 1%)
        const progressoFinal = progresso >= 99 ? 100 : progresso;

        // Verificar se todas as sessões do ciclo estão concluídas
        const totalSessoes = sessoesOrdenadas.length;
        const sessoesConcluidasCount = sessoesConcluidas.size;
        const cicloConcluido = totalSessoes > 0 && sessoesConcluidasCount === totalSessoes;

        // Calcular progresso baseado em sessões concluídas (conforme solicitado)
        const progressoPorSessoes = totalSessoes > 0
            ? (sessoesConcluidasCount / totalSessoes) * 100
            : 0;

        return {
            totalTempoCiclo: tempoTotal,
            tempoConcluidoCiclo: tempoConcluido,
            dadosGrafico,
            proximaSessao: proxima,
            progressoPercentual: Math.round(progressoPorSessoes),
            legendaDisciplinas,
            cicloConcluido,
            totalSessoes,
            sessoesConcluidasCount,
            tempoPorSessaoCiclo
        };
    }, [cicloAtivo, disciplinasMap, ultimaSessaoConcluidaId, todasSessoesDoCiclo, sessoesOrdenadas]);

    // Verificar se há sessão ativa para a próxima sessão do ciclo
    const sessaoAtivaParaCiclo = useMemo(() => {
        if (!sessaoAtual || !proximaSessao) return null;
        const sessaoCicloId = `ciclo-${proximaSessao.id}`;
        return sessaoAtual.topico.id === sessaoCicloId ? sessaoAtual : null;
    }, [sessaoAtual, proximaSessao]);

    // Scroll automático quando ultimaSessaoConcluidaId muda
    useEffect(() => {
        if (ultimaSessaoConcluidaId && proximaSessao) {
            // Aguardar um pouco para garantir que o DOM foi atualizado
            const timeoutId = setTimeout(() => {
                const ref = sessaoRefs.current.get(proximaSessao.id);
                if (ref) {
                    ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        }
    }, [ultimaSessaoConcluidaId, proximaSessao]);

    // Listener para quando o modal de salvar sessão é fechado após salvar
    const isSaveModalOpen = useUiStore(state => state.isSaveModalOpen);
    useEffect(() => {
        // Quando o modal fecha e há uma sessão ativa, verificar se foi salva
        if (!isSaveModalOpen && sessaoAtual === null && ultimaSessaoConcluidaId && proximaSessao) {
            // Aguardar um pouco para garantir que o estado foi atualizado
            const timeoutId = setTimeout(() => {
                const ref = sessaoRefs.current.get(proximaSessao.id);
                if (ref) {
                    ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);

            return () => clearTimeout(timeoutId);
        }
    }, [isSaveModalOpen, sessaoAtual, ultimaSessaoConcluidaId, proximaSessao]);

    const handleUpdateCicloName = useCallback(() => {
        if (cicloAtivo && editedCicloName.trim() && editedCicloName.trim() !== cicloAtivo.nome) {
            updateCiclo(cicloAtivo.id, { nome: editedCicloName.trim() });
            toast.success("Nome do ciclo atualizado.");
        }
        setIsEditingCiclo(false);
    }, [cicloAtivo, editedCicloName, updateCiclo]);

    const handleRemoveCiclo = useCallback(() => {
        if (cicloAtivo && window.confirm(`Tem certeza que deseja remover o ciclo "${cicloAtivo.nome}"?`)) {
            removeCiclo(cicloAtivo.id);
            toast.success("Ciclo removido.");
        }
    }, [cicloAtivo, removeCiclo]);

    const handleAddSessao = useCallback(async () => {
        if (cicloAtivo && novaSessaoData.disciplinaId && parseInt(novaSessaoData.tempoMinutos) > 0) {
            try {
                await addSessaoAoCiclo(cicloAtivo.id, novaSessaoData.disciplinaId, parseInt(novaSessaoData.tempoMinutos) * 60);
                toast.success("Sessão adicionada ao ciclo.");
                setNovaSessaoData({ disciplinaId: '', tempoMinutos: '60' });
                setIsAddingSessao(false);
            } catch (error) {
                console.error("Erro ao adicionar sessão:", error);
                toast.error("Erro ao adicionar sessão. Tente novamente.");
            }
        } else {
            toast.error("Selecione uma disciplina e defina um tempo válido.");
        }
    }, [cicloAtivo, novaSessaoData, addSessaoAoCiclo]);

    const handleIniciarEstudoCiclo = useCallback((sessao: SessaoCiclo) => {
        const disciplina = disciplinas.find(d => d.id === sessao.disciplina_id);
        if (disciplina && cicloAtivo) {
            iniciarSessao({
                id: `ciclo-${sessao.id}`,
                nome: disciplina.nome,
                disciplinaId: disciplina.id
            }, 'cronometro');
            toast.success(`Iniciando estudos de ${disciplina.nome}!`);
        }
    }, [disciplinas, cicloAtivo, iniciarSessao]);

    const handleConcluirSessao = useCallback(() => {
        if (!cicloAtivo || !proximaSessao || !sessaoAtivaParaCiclo || isSaving) return;

        // Abrir o modal de salvar sessão para escolher o tópico
        encerrarSessaoParaSalvar();
    }, [cicloAtivo, proximaSessao, sessaoAtivaParaCiclo, isSaving, encerrarSessaoParaSalvar]);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!cicloAtivo || !over || active.id === over.id) return;

        const oldIndex = sessoesOrdenadas.findIndex(s => s.id === active.id);
        const newIndex = sessoesOrdenadas.findIndex(s => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const sessoesReordenadas = arrayMove(sessoesOrdenadas, oldIndex, newIndex);
        const sessoesComOrdem = sessoesReordenadas.map((s: SessaoCiclo, i: number) => ({ ...s, ordem: i }));

        try {
            await updateCiclo(cicloAtivo.id, { sessoes: sessoesComOrdem });
            toast.success("Sessões reordenadas.");
        } catch (error) {
            console.error("Erro ao reordenar sessões:", error);
            toast.error("Erro ao reordenar sessões. Tente novamente.");
        }
    }, [cicloAtivo, sessoesOrdenadas, updateCiclo]);

    const handleUpdateTempo = useCallback(async (sessaoId: string, delta: number) => {
        if (!cicloAtivo) return;
        const sessao = cicloAtivo.sessoes?.find(s => s.id === sessaoId);
        if (!sessao) return;

        const novoTempo = Math.max(60, sessao.tempo_previsto + delta); // Mínimo de 1 minuto
        const sessoesAtualizadas = cicloAtivo.sessoes?.map(s =>
            s.id === sessaoId ? { ...s, tempo_previsto: novoTempo } : s
        );

        try {
            await updateCiclo(cicloAtivo.id, { sessoes: sessoesAtualizadas });
            toast.success(`Tempo atualizado para ${formatTime(novoTempo)}`);
        } catch (error) {
            console.error("Erro ao atualizar tempo:", error);
            toast.error("Erro ao atualizar tempo. Tente novamente.");
        }
    }, [cicloAtivo, updateCiclo]);

    const handleTrocarSessao = useCallback(() => {
        setIsTrocarSessaoModalOpen(true);
    }, []);

    const handleSelecionarSessao = useCallback((sessaoSelecionada: SessaoCiclo) => {
        if (!cicloAtivo) return;

        // Atualizar a última sessão concluída para a sessão anterior à selecionada
        // Isso faz com que a sessão selecionada se torne a nova "próxima sessão"
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
    }, [cicloAtivo, sessoesOrdenadas, setUltimaSessaoConcluida, handleIniciarEstudoCiclo, disciplinasMap]);

    // Função para setar ref de sessão
    const setSessaoRef = useCallback((sessaoId: string, element: HTMLDivElement | null) => {
        if (element) {
            sessaoRefs.current.set(sessaoId, element);
        } else {
            sessaoRefs.current.delete(sessaoId);
        }
    }, []);

    return (
        <div data-tutorial="ciclos-content" className="max-w-7xl mx-auto space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            <RepeatIcon className="w-8 h-8" /> Ciclos de Estudos
                        </h1>
                        <span className="text-sm text-muted-foreground font-medium">
                            {ciclosCriados}/{maxCiclos === Infinity ? '∞' : maxCiclos} ciclos
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1">Organize suas disciplinas em um ciclo rotativo para garantir um estudo equilibrado.</p>
                </div>
                <button
                    onClick={() => {
                        if (!podeCriarCiclo) {
                            toast.error(`Limite de ${maxCiclos} ${maxCiclos === 1 ? 'ciclo atingido' : 'ciclos atingido'}. Faça upgrade para criar mais!`);
                            return;
                        }
                        openCriarCicloModal();
                    }}
                    disabled={!podeCriarCiclo}
                    aria-label="Criar novo ciclo de estudos"
                    className={`h-10 px-4 flex items-center gap-2 rounded-lg text-sm font-medium transition-colors ${podeCriarCiclo
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                        }`}
                >
                    <PlusCircleIcon className="w-4 h-4" />
                    {podeCriarCiclo ? 'Criar Novo Ciclo' : `Limite Atingido (${planType.toUpperCase()})`}
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
                                    aria-label={`Iniciar sessão de ${disciplinasMap.get(proximaSessao.disciplina_id)}`}
                                    className="h-12 px-6 flex items-center gap-2 rounded-lg bg-primary text-black text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
                                >
                                    <PlayIcon className="w-4 h-4" />
                                    Iniciar Agora
                                </button>
                            ) : (
                                <button
                                    onClick={handleConcluirSessao}
                                    disabled={isSaving}
                                    aria-label={`Concluir sessão de ${disciplinasMap.get(proximaSessao.disciplina_id)}`}
                                    className="h-12 px-6 flex items-center gap-2 rounded-lg bg-secondary text-black text-sm font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2Icon className="w-4 h-4" />
                                            Concluir Sessão
                                        </>
                                    )}
                                </button>
                            )}
                            <button
                                onClick={handleTrocarSessao}
                                aria-label="Trocar sessão de estudo"
                                className="h-12 px-4 flex items-center gap-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors"
                            >
                                Trocar Sessão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {cicloAtivo ? (
                <div className="flex gap-6">
                    {/* Sidebar Fixa com Todos os Ciclos */}
                    <div className={`${sidebarOpen ? 'w-64' : 'w-12'} transition-all duration-300 flex-shrink-0`}>
                        <div className="sticky top-6 bg-card rounded-xl border border-border shadow-sm p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-bold text-foreground transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                                    Ciclos
                                </h3>
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {sidebarOpen ? <XIcon className="w-4 h-4" /> : <RepeatIcon className="w-4 h-4" />}
                                </button>
                            </div>
                            {sidebarOpen && (
                                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                                    {ciclos.map(ciclo => (
                                        <button
                                            key={ciclo.id}
                                            onClick={() => setCicloAtivoId(ciclo.id)}
                                            aria-label={`Selecionar ciclo ${ciclo.nome}`}
                                            className={`w-full text-left p-3 rounded-lg border transition-all ${cicloAtivoId === ciclo.id
                                                ? 'bg-primary/10 border-primary text-foreground font-semibold'
                                                : 'bg-background border-border text-muted-foreground hover:bg-muted hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm truncate">{ciclo.nome}</span>
                                                {cicloAtivoId === ciclo.id && (
                                                    <CheckCircle2Icon className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                                        <button
                                            onClick={handleUpdateCicloName}
                                            aria-label="Salvar nome do ciclo"
                                            className="p-2 rounded-md hover:bg-muted"
                                        >
                                            <SaveIcon className="w-4 h-4 text-primary" />
                                        </button>
                                    </div>
                                ) : (
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        {cicloAtivo.nome}
                                        <button
                                            onClick={() => { setIsEditingCiclo(true); setEditedCicloName(cicloAtivo.nome); }}
                                            aria-label="Editar nome do ciclo"
                                            className="p-1.5 text-muted-foreground hover:text-primary"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </button>
                                    </h2>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold text-foreground">{formatTime(totalTempoCiclo)}</p>
                                        <p className="text-xs text-muted-foreground">Tempo total</p>
                                    </div>
                                    <button
                                        onClick={handleRemoveCiclo}
                                        aria-label="Remover ciclo"
                                        className="p-2 text-muted-foreground hover:text-red-500"
                                    >
                                        <Trash2Icon className="w-4 h-4" />
                                    </button>
                                </div>
                            </header>

                            {/* Campo de Busca e Filtro */}
                            <div className="p-4 border-b border-border bg-muted/10 flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por disciplina..."
                                        value={buscaDisciplina}
                                        onChange={(e) => setBuscaDisciplina(e.target.value)}
                                        className="w-full bg-background border border-border rounded-md px-3 py-2 pl-9 text-sm text-foreground focus:ring-primary focus:border-primary"
                                        aria-label="Buscar sessão por disciplina"
                                    />
                                    <SearchIcon className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mostrarConcluidas}
                                        onChange={(e) => setMostrarConcluidas(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                        aria-label="Mostrar sessões concluídas"
                                    />
                                    <span className="text-sm text-muted-foreground">Mostrar concluídas</span>
                                </label>
                            </div>

                            {/* Barra de Progresso e Badge */}
                            <div className="p-4 border-b border-border bg-muted/20">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-medium transition-all duration-300 flex items-center ${cicloConcluido
                                            ? 'text-green-500'
                                            : 'text-muted-foreground'
                                            }`}>
                                            Progresso do Ciclo
                                            {cicloConcluido && <CheckCircle2Icon className="w-4 h-4 ml-2 text-green-500" />}
                                        </span>
                                        {cicloConcluido ? (
                                            <span className="text-xs px-2 py-1 rounded-full font-bold bg-green-500/20 text-green-600 dark:text-green-400 flex items-center gap-1 transition-all duration-300">
                                                <CheckCircle2Icon className="w-3 h-3" />
                                                Ciclo Concluído
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 rounded-full font-bold bg-primary/20 text-primary transition-all duration-300">
                                                {sessoesHojeDoCiclo.length} {sessoesHojeDoCiclo.length === 1 ? 'sessão' : 'sessões'} hoje
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-sm font-bold transition-all duration-300 ${cicloConcluido
                                        ? 'text-green-500'
                                        : 'text-foreground'
                                        }`}>
                                        {progressoPercentual}%
                                    </span>
                                </div>
                                {/* Barra de Progresso Moderna */}
                                <div
                                    className="w-full bg-muted/30 rounded-full h-3 mt-3 overflow-hidden relative group cursor-pointer"
                                    title={`${progressoPercentual}% concluído`}
                                    aria-label={`Progresso do ciclo: ${progressoPercentual}% concluído`}
                                >
                                    <div
                                        className={`h-full rounded-full transition-[width] duration-700 ease-out ${progressoPercentual === 100
                                            ? 'bg-green-500'
                                            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                                            }`}
                                        style={{ width: `${progressoPercentual}%` }}
                                    />
                                    {/* Tooltip customizado */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-card border border-border rounded-md text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                                        {progressoPercentual}% concluído
                                    </div>
                                </div>
                                <p className="text-xs mt-1 text-gray-400 dark:text-gray-500 text-right">
                                    {progressoPercentual.toFixed(0)}%
                                </p>
                                <div className={`flex justify-between text-xs mt-2 transition-all duration-300 ${cicloConcluido
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-muted-foreground'
                                    }`}>
                                    <span>
                                        {sessoesConcluidasCount} de {totalSessoes} {totalSessoes === 1 ? 'sessão' : 'sessões'} concluída{totalSessoes !== 1 ? 's' : ''}
                                    </span>
                                    <span>{formatTime(totalTempoCiclo)} total</span>
                                </div>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={sessoesFiltradas.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="divide-y divide-border">
                                        {sessoesFiltradas.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                <p className="text-sm">Nenhuma sessão encontrada.</p>
                                            </div>
                                        ) : (
                                            sessoesFiltradas.map((sessao, index) => {
                                                const isNext = sessao.id === proximaSessao?.id;
                                                const isActive = sessaoAtivaParaCiclo?.topico.id === `ciclo-${sessao.id}`;
                                                const tempoDecorrido = isActive ? sessaoAtivaParaCiclo.elapsedSeconds : undefined;

                                                // Verificar se a sessão foi concluída (tempo estudado >= tempo previsto)
                                                const tempoEstudadoSessao = tempoPorSessaoCiclo.get(sessao.id) || 0;
                                                const tempoPrevistoSessao = sessao.tempo_previsto || 0;
                                                const isConcluido = sessoesConcluidasIds.has(sessao.id) && tempoEstudadoSessao >= tempoPrevistoSessao;

                                                // Verificar se a sessão está parcialmente concluída (tempo estudado > 0 mas < tempo previsto)
                                                const isParcial = !isConcluido && tempoEstudadoSessao > 0 && tempoEstudadoSessao < tempoPrevistoSessao;
                                                const tempoFaltante = isParcial ? tempoPrevistoSessao - tempoEstudadoSessao : undefined;

                                                // Encontrar índice original na lista completa para numeração
                                                const indiceOriginal = sessoesOrdenadas.findIndex(s => s.id === sessao.id);

                                                return (
                                                    <div
                                                        key={sessao.id}
                                                        ref={(el) => setSessaoRef(sessao.id, el)}
                                                    >
                                                        <SortableSessaoItem
                                                            sessao={sessao}
                                                            index={indiceOriginal >= 0 ? indiceOriginal : index}
                                                            isNext={isNext}
                                                            isActive={isActive}
                                                            disciplinaNome={disciplinasMap.get(sessao.disciplina_id) || 'Desconhecida'}
                                                            tempoDecorrido={tempoDecorrido}
                                                            isConcluido={isConcluido}
                                                            isParcial={isParcial}
                                                            tempoFaltante={tempoFaltante}
                                                            isSaving={isSaving && isActive}
                                                            onIniciar={() => handleIniciarEstudoCiclo(sessao)}
                                                            onConcluir={handleConcluirSessao}
                                                            onRemove={() => removeSessaoDoCiclo(cicloAtivo.id, sessao.id)}
                                                            onUpdateTempo={(delta) => handleUpdateTempo(sessao.id, delta)}
                                                        />
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </SortableContext>
                            </DndContext>

                            {isAddingSessao && (
                                <div className="p-4 bg-muted/20 flex items-end gap-3 border-t border-border">
                                    <div className="flex-1">
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Disciplina</label>
                                        <select
                                            value={novaSessaoData.disciplinaId}
                                            onChange={e => setNovaSessaoData({ ...novaSessaoData, disciplinaId: e.target.value })}
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
                                            onChange={e => setNovaSessaoData({ ...novaSessaoData, tempoMinutos: e.target.value })}
                                            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleAddSessao}
                                        aria-label="Adicionar sessão ao ciclo"
                                        className="h-10 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
                                    >
                                        Adicionar
                                    </button>
                                    <button
                                        onClick={() => setIsAddingSessao(false)}
                                        aria-label="Cancelar adição de sessão"
                                        className="h-10 w-10 rounded-lg border border-border text-muted-foreground hover:bg-muted"
                                    >
                                        <XIcon className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            )}
                            {!isAddingSessao && (
                                <div className="p-4 border-t border-border">
                                    <button
                                        onClick={() => setIsAddingSessao(true)}
                                        aria-label="Adicionar nova sessão de estudo"
                                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-primary font-medium text-sm hover:bg-primary/10"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Adicionar Sessão de Estudo
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className={`bg-card rounded-xl border border-border shadow-sm p-4 space-y-4 ${progressoPercentual === 100 ? 'opacity-90' : ''}`}>
                            <h3 className={`font-bold text-center ${progressoPercentual === 100 ? 'text-gray-500 line-through' : 'text-foreground'}`}>Distribuição do Tempo</h3>
                            {dadosGrafico.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={dadosGrafico}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                paddingAngle={5}
                                            >
                                                {dadosGrafico.map((entry) => (
                                                    <Cell
                                                        key={`cell-${entry.id}`}
                                                        fill={entry.color}
                                                        style={{ transition: 'fill 0.3s ease' }}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                content={<CustomPieTooltip />}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Legenda customizada - apenas disciplinas únicas */}
                                    {legendaDisciplinas.length > 0 && (
                                        <div className="flex flex-wrap gap-3 justify-center pt-2">
                                            {legendaDisciplinas.map((item) => (
                                                <div
                                                    key={item.disciplinaId}
                                                    className="flex items-center gap-2 text-xs"
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-muted-foreground">
                                                        {item.name}
                                                        {item.progresso >= 1.0 && (
                                                            <span className="ml-1 text-green-500">✓</span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
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
                </div>
            ) : (
                <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
                    <RepeatIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground">Nenhum ciclo de estudos criado</h3>
                    <p className="text-muted-foreground mt-2 mb-6">Comece a organizar seus estudos de forma mais eficiente.</p>
                    <button
                        onClick={openCriarCicloModal}
                        aria-label="Criar meu primeiro ciclo de estudos"
                        className="h-11 px-6 flex items-center mx-auto gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        Criar meu primeiro ciclo
                    </button>
                </div>
            )}

            {/* Modal de Trocar Sessão */}
            {isTrocarSessaoModalOpen && cicloAtivo && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
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
                                aria-label="Fechar modal de trocar sessão"
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
                                            aria-label={`Selecionar sessão de ${disciplinaNome}`}
                                            className={`w-full p-4 rounded-lg border transition-all text-left ${isActive
                                                ? 'bg-muted/50 border-muted cursor-not-allowed opacity-60'
                                                : isProxima
                                                    ? 'bg-primary/10 border-primary hover:bg-primary/20'
                                                    : 'bg-background border-border hover:bg-muted/50 hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${isProxima
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
