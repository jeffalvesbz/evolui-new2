import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEditalStore } from '../stores/useEditalStore';
import { FootprintsIcon, CheckIcon, PlayIcon, SparklesIcon, PlusIcon, XIcon, Trash2Icon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { Topico } from '../types';
import { useModalStore } from '../stores/useModalStore';
import { toast } from './Sonner';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, isSameWeek, addMonths, subMonths, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DraggableTopic = Topico & { disciplinaNome: string; disciplinaId: string; };

const TopicCard: React.FC<{
    topic: DraggableTopic & { concluidoNaTrilha?: boolean };
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
    isDragging?: boolean;
    isDragOver?: boolean;
    dragOverPosition?: 'above' | 'below' | null;
    onRemove?: (topicId: string) => void;
    onToggleConcluido: () => void;
    onPreviewOpen: () => void;
    onPreviewClose: () => void;
    onPreviewCancelClose: () => void;
    isAnyDragging: boolean;
}> = ({
    topic,
    onDragStart,
    onDragEnd,
    isDragging = false,
    isDragOver = false,
    dragOverPosition = null,
    onRemove,
    onToggleConcluido,
    onPreviewOpen,
    onPreviewClose,
    onPreviewCancelClose,
    isAnyDragging,
}) => {
    const { iniciarSessao, iniciarSessaoParaConclusaoRapida } = useEstudosStore();

    const concluidoNaTrilha = topic.concluidoNaTrilha || false;

    const rawDescricao = (topic as any)?.descricao ?? (topic as any)?.detalhes ?? (topic as any)?.conteudo ?? (topic as any)?.resumo;
    const descricaoCompleta = typeof rawDescricao === 'string' && rawDescricao.trim().length > 0 ? rawDescricao : topic.titulo;
    const gradientClass = concluidoNaTrilha ? 'from-emerald-500/25 via-emerald-500/5' : 'from-card via-card/70';

    const handleConcluir = () => {
        // Marca como concluído na trilha
        onToggleConcluido();
        // Abre o modal de salvar com 1 hora pré-preenchida
        iniciarSessaoParaConclusaoRapida({
            id: topic.id,
            nome: topic.titulo,
            disciplinaId: topic.disciplinaId,
        });
    };
    
    const handleIniciarEstudo = () => {
        iniciarSessao({
            id: topic.id,
            nome: topic.titulo,
            disciplinaId: topic.disciplinaId
        });
    };

    const cardClasses = `relative h-full overflow-hidden rounded-xl border shadow-sm transition-all duration-200 flex flex-col gap-3 group bg-card/80 p-4 ${
        isDragging
            ? 'opacity-40 scale-95 cursor-grabbing'
            : concluidoNaTrilha
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : 'border-border/40 hover:border-primary/60 hover:shadow-lg'
    } ${concluidoNaTrilha ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary`;

    const handleMouseEnter = () => {
        if (isAnyDragging || isDragging) return;
        onPreviewCancelClose();
        onPreviewOpen();
    };

    const handleMouseLeave = () => {
        onPreviewClose();
    };

    const handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
        if (event.currentTarget !== event.target) return;
        if (isAnyDragging) return;
        onPreviewCancelClose();
        onPreviewOpen();
    };

    const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (nextTarget && event.currentTarget.contains(nextTarget)) return;
        onPreviewClose();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if ((event.key === 'Enter' || event.key === ' ') && !isAnyDragging) {
            event.preventDefault();
            onPreviewCancelClose();
            onPreviewOpen();
        }
    };

    const showIndicatorTop = isDragOver && dragOverPosition === 'above';
    const showIndicatorBottom = isDragOver && dragOverPosition === 'below';

    return (
      <div className="relative h-full">
        <div
          draggable={!concluidoNaTrilha}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={cardClasses}
          data-dragging={isDragging}
          tabIndex={0}
          style={{
            transform: isDragging ? 'scale(0.95)' : undefined,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        >
        {showIndicatorTop && (
          <div className="pointer-events-none absolute inset-x-3 -top-1 h-1 rounded-full bg-primary/80 shadow-[0_0_12px_rgba(99,102,241,0.45)] animate-pulse" />
        )}
        <div className="flex items-start justify-between gap-2 w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: `hsl(${(topic.disciplinaId.charCodeAt(0) * 137.5) % 360}, 70%, 60%)`
                }}
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground break-words leading-tight">{topic.disciplinaNome}</p>
            </div>
            <p className={`text-xs sm:text-sm font-semibold leading-snug text-card-foreground ${concluidoNaTrilha ? 'text-muted-foreground line-through' : 'text-card-foreground'} truncate`}>
              {topic.titulo}
            </p>
          </div>
          <div className="flex items-start gap-1 flex-shrink-0">
            {concluidoNaTrilha && (
              <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full bg-green-500 text-black flex-shrink-0">
                <CheckIcon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              </div>
            )}
          </div>
        </div>
        <div className="relative flex-1 w-full">
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line clamp-5 pr-1 pb-6">
            {descricaoCompleta}
          </p>
          <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t ${gradientClass}`} />
        </div>
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity w-full pt-1 border-t border-border/50">
          {/* Botões sempre visíveis, mesmo quando concluído */}
          <button
              onClick={(e) => {
                  e.stopPropagation();
                  handleIniciarEstudo();
              }}
              className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              title="Iniciar estudo"
              aria-label="Iniciar estudo"
          >
              <PlayIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          {concluidoNaTrilha ? (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleConcluido();
                }}
                className="p-1.5 sm:p-2 rounded-full text-green-600 hover:bg-green-500/10 transition-colors"
                title="Desmarcar como concluído"
                aria-label="Desmarcar como concluído"
            >
                <XIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          ) : (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleConcluir();
                }}
                className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                title="Concluir tópico (registro rápido)"
                aria-label="Concluir tópico"
            >
                <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
          {onRemove && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(topic.id);
                }}
                className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remover do dia"
                aria-label="Remover do dia"
            >
                <XIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
        {showIndicatorBottom && (
          <div className="pointer-events-none absolute inset-x-3 -bottom-1 h-1 rounded-full bg-primary/80 shadow-[0_0_12px_rgba(99,102,241,0.45)] animate-pulse" />
        )}
      </div>
      </div>
    );
};

interface TopicPreviewState {
    topic: DraggableTopic & { concluidoNaTrilha?: boolean };
    diaNome: string;
}

interface TopicPreviewOverlayProps {
    data: TopicPreviewState;
    onClose: () => void;
    onKeepOpen: () => void;
    onScheduleClose: () => void;
}

const formatDateSafely = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    try {
        return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
        return value;
    }
};

const TopicPreviewOverlay: React.FC<TopicPreviewOverlayProps> = ({ data, onClose, onKeepOpen, onScheduleClose }) => {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        onKeepOpen();
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onKeepOpen]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            dialogRef.current?.focus();
        });
        return () => cancelAnimationFrame(frame);
    }, []);

    const rawDescricao = (data.topic as any)?.descricao ?? (data.topic as any)?.detalhes ?? (data.topic as any)?.conteudo ?? (data.topic as any)?.resumo;
    const descricaoCompleta = typeof rawDescricao === 'string' && rawDescricao.trim().length > 0 ? rawDescricao : data.topic.titulo;
    const ultimaRevisaoFormatada = formatDateSafely((data.topic as any)?.ultimaRevisao ?? data.topic.ultimaRevisao);
    const proximaRevisaoFormatada = formatDateSafely((data.topic as any)?.proximaRevisao ?? data.topic.proximaRevisao);

    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-xl px-4 py-6 sm:px-6"
            onMouseEnter={onKeepOpen}
            onMouseLeave={onScheduleClose}
            onClick={handleOverlayClick}
            role="presentation"
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={`Pré-visualização do tópico ${data.topic.titulo}`}
                tabIndex={-1}
                className="relative flex h-screen w-screen flex-col overflow-hidden bg-card text-card-foreground focus-visible:outline-none sm:h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-3xl sm:border sm:border-border"
            >
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    aria-label="Fechar pré-visualização"
                    type="button"
                >
                    <XIcon className="h-4 w-4" />
                    Fechar
                </button>
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                            <span className="rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">{data.diaNome}</span>
                            <span className="rounded-full bg-muted/60 px-2.5 py-1 font-medium text-muted-foreground">{data.topic.disciplinaNome}</span>
                            <span className="rounded-full bg-muted/60 px-2.5 py-1 font-medium capitalize text-muted-foreground">
                                Dificuldade: {data.topic.nivelDificuldade || 'N/A'}
                            </span>
                            {data.topic.concluidoNaTrilha && (
                                <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-500">Concluído na trilha</span>
                            )}
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold leading-tight text-card-foreground sm:text-3xl">{data.topic.titulo}</h2>
                            <div className="grid gap-2 text-xs sm:grid-cols-2 sm:text-sm text-muted-foreground">
                                {ultimaRevisaoFormatada && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-card-foreground">Última revisão:</span>
                                        <span>{ultimaRevisaoFormatada}</span>
                                    </div>
                                )}
                                {proximaRevisaoFormatada && (
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-card-foreground">Próxima revisão:</span>
                                        <span>{proximaRevisaoFormatada}</span>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-card/60 p-4 text-sm leading-relaxed text-muted-foreground sm:text-base whitespace-pre-wrap">
                                {descricaoCompleta}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const DIAS_SEMANA = [
    { id: 'seg', nome: 'Segunda' },
    { id: 'ter', nome: 'Terça' },
    { id: 'qua', nome: 'Quarta' },
    { id: 'qui', nome: 'Quinta' },
    { id: 'sex', nome: 'Sexta' },
    { id: 'sab', nome: 'Sábado' },
    { id: 'dom', nome: 'Domingo' },
];

// Função para normalizar strings (remover acentos e converter para minúsculas)
const normalizarDia = (s: string) => {
    // Extrair apenas a primeira palavra (antes do hífen, se houver)
    const primeiraPalavra = s.split('-')[0].trim();
    return primeiraPalavra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const TrilhaSemanal: React.FC = () => {
    const { 
        trilha, 
        moveTopicoNaTrilha, 
        setTrilhaCompleta, 
        trilhasPorSemana, 
        setTrilhaSemana, 
        getTrilhaSemana,
        toggleTopicoConcluidoNaTrilha,
        isTopicoConcluidoNaTrilha,
        setSemanaAtualKey,
        trilhaConclusao,
        loadTrilhaSemanal
    } = useEstudosStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const { openGeradorPlanoModal } = useModalStore();
    const { editalAtivo } = useEditalStore();

    // Estado para semana atual
    const [semanaAtual, setSemanaAtual] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    
    // Detectar o dia atual e normalizar
    const diaAtualNormalizado = useMemo(() => {
        const diaAtual = format(new Date(), 'EEEE', { locale: ptBR });
        // date-fns retorna "segunda-feira", "terça-feira", etc.
        // Extraímos apenas a primeira palavra e normalizamos
        return normalizarDia(diaAtual);
    }, []);
    const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
    const [diaParaAdicionar, setDiaParaAdicionar] = useState<string | null>(null);
    const [topicosSelecionados, setTopicosSelecionados] = useState<Set<string>>(new Set());
    const [buscaModal, setBuscaModal] = useState('');
    const [disciplinaFiltro, setDisciplinaFiltro] = useState<string | null>(null);
    const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);
    const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [activePreview, setActivePreview] = useState<TopicPreviewState | null>(null);
    const previewCloseTimeoutRef = useRef<number | null>(null);

    const cancelPreviewClose = useCallback(() => {
        if (previewCloseTimeoutRef.current) {
            window.clearTimeout(previewCloseTimeoutRef.current);
            previewCloseTimeoutRef.current = null;
        }
    }, []);

    const schedulePreviewClose = useCallback(() => {
        cancelPreviewClose();
        previewCloseTimeoutRef.current = window.setTimeout(() => {
            setActivePreview(null);
            previewCloseTimeoutRef.current = null;
        }, 150);
    }, [cancelPreviewClose]);

    const openPreview = useCallback(
        (topic: DraggableTopic & { concluidoNaTrilha?: boolean }, diaNome: string) => {
            cancelPreviewClose();
            setActivePreview({ topic, diaNome });
        },
        [cancelPreviewClose]
    );

    const closePreviewImmediately = useCallback(() => {
        cancelPreviewClose();
        setActivePreview(null);
    }, [cancelPreviewClose]);

    useEffect(() => {
        return () => {
            if (previewCloseTimeoutRef.current) {
                window.clearTimeout(previewCloseTimeoutRef.current);
            }
        };
    }, []);

    // Gerar chave da semana (YYYY-MM-DD - data de início da semana)
    const getWeekKey = (date: Date) => {
        const start = startOfWeek(date, { weekStartsOn: 1 });
        return format(start, 'yyyy-MM-dd');
    };

    // Carregar trilha da semana atual
    const weekKey = useMemo(() => getWeekKey(semanaAtual), [semanaAtual]);
    
    const trilhaSemanaAtual = useMemo(() => {
        return getTrilhaSemana(weekKey);
    }, [weekKey, trilhasPorSemana]);

    // Carregar trilha semanal do banco quando o componente montar ou edital mudar
    useEffect(() => {
        if (editalAtivo?.id) {
            loadTrilhaSemanal(editalAtivo.id).catch(err => {
                console.error("Erro ao carregar trilha semanal:", err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editalAtivo?.id]);

    // Atualizar trilha quando semana mudar
    useEffect(() => {
        const trilhaCarregada = getTrilhaSemana(weekKey);
        const trilhaSerializada = JSON.stringify(trilhaCarregada);
        const trilhaAtualSerializada = JSON.stringify(trilha);
        
        // Só atualiza se a trilha carregada for diferente da atual (evita loop infinito)
        if (trilhaSerializada !== trilhaAtualSerializada) {
            if (trilhaCarregada && Object.values(trilhaCarregada).some(arr => arr.length > 0)) {
                setTrilhaCompleta(trilhaCarregada);
            } else {
                // Só atualiza para vazio se realmente não há dados
                const isEmpty = Object.values(trilha).every(arr => arr.length === 0);
                if (!isEmpty) {
                    const emptyTrilha = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
                    setTrilhaCompleta(emptyTrilha);
                }
            }
        }
        
        // Sempre atualiza a semana atual key
        setSemanaAtualKey(weekKey);
        
        // Se mudou de semana e há edital ativo, carregar trilha da nova semana
        if (editalAtivo?.id) {
            loadTrilhaSemanal(editalAtivo.id, weekKey).catch(err => {
                console.error("Erro ao carregar trilha da nova semana:", err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [weekKey]);
    
    // Effect separado para quando trilhasPorSemana mudar (após carregar do banco)
    // Usa useRef para evitar loops quando a mudança vem de setTrilhaCompleta
    const prevTrilhasPorSemanaRef = React.useRef(trilhasPorSemana);
    useEffect(() => {
        // Só processa se trilhasPorSemana realmente mudou (não apenas referência)
        const prevSerialized = JSON.stringify(prevTrilhasPorSemanaRef.current);
        const currentSerialized = JSON.stringify(trilhasPorSemana);
        
        if (prevSerialized !== currentSerialized) {
            prevTrilhasPorSemanaRef.current = trilhasPorSemana;
            
            const trilhaCarregada = getTrilhaSemana(weekKey);
            const trilhaSerializada = JSON.stringify(trilhaCarregada);
            const trilhaAtualSerializada = JSON.stringify(trilha);
            
            // Só atualiza se for diferente e não for vazio (para evitar sobrescrever mudanças do usuário)
            if (trilhaSerializada !== trilhaAtualSerializada && 
                trilhaCarregada && 
                Object.values(trilhaCarregada).some(arr => arr.length > 0)) {
                setTrilhaCompleta(trilhaCarregada);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [trilhasPorSemana]);

    const navegarSemana = (direcao: 'anterior' | 'proxima') => {
        const novaSemana = direcao === 'proxima' 
            ? addWeeks(semanaAtual, 1)
            : subWeeks(semanaAtual, 1);
        setSemanaAtual(novaSemana);
    };

    const irParaSemanaAtual = () => {
        setSemanaAtual(startOfWeek(new Date(), { weekStartsOn: 1 }));
    };

    const isSemanaAtual = isSameWeek(semanaAtual, new Date(), { weekStartsOn: 1 });

    const allTopics = useMemo(() => {
        if (!disciplinas || disciplinas.length === 0) return [];
        return disciplinas.flatMap(d => 
            (d.topicos || []).map(t => ({ ...t, disciplinaNome: d.nome, disciplinaId: d.id }))
        );
    }, [disciplinas]);

    const allTopicsMap = useMemo(() => new Map(allTopics.map(t => [t.id, t])), [allTopics]);

    const topicsByDay = useMemo(() => {
        const result: { [key: string]: DraggableTopic[] } = {};
        for (const dia of DIAS_SEMANA) {
            const topicos = (trilha[dia.id] || []).map(topicId => {
                const topico = allTopicsMap.get(topicId);
                if (!topico) return null;
                // Verificar conclusão na trilha (não usa o concluido do tópico)
                const concluidoNaTrilha = isTopicoConcluidoNaTrilha(weekKey, dia.id, topicId);
                return { ...topico, concluidoNaTrilha };
            }).filter((t): t is DraggableTopic & { concluidoNaTrilha: boolean } => !!t);
            // Separar concluídos e não concluídos na trilha
            const pendentes = topicos.filter(t => !t.concluidoNaTrilha);
            const concluidos = topicos.filter(t => t.concluidoNaTrilha);
            result[dia.id] = [...pendentes, ...concluidos];
        }
        return result;
    }, [trilha, allTopicsMap, weekKey, isTopicoConcluidoNaTrilha, trilhaConclusao]);

    // Estatísticas gerais
    const estatisticas = useMemo(() => {
        const todosTopicos = Object.values(topicsByDay).flat();
        const total = todosTopicos.length;
        const concluidos = todosTopicos.filter(t => (t as any).concluidoNaTrilha).length;
        const pendentes = total - concluidos;
        const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
        return { total, concluidos, pendentes, progresso };
    }, [topicsByDay]);

    // Estatísticas por dia
    const estatisticasPorDia = useMemo(() => {
        const stats: { [key: string]: { total: number; concluidos: number; progresso: number } } = {};
        for (const dia of DIAS_SEMANA) {
            const topicos = topicsByDay[dia.id];
            const total = topicos.length;
            const concluidos = topicos.filter(t => (t as any).concluidoNaTrilha).length;
            const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
            stats[dia.id] = { total, concluidos, progresso };
        }
        return stats;
    }, [topicsByDay]);

    const handleDragStart = (e: React.DragEvent, topicId: string, fromDia: string, fromIndex: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ topicId, fromDia, fromIndex }));
        e.dataTransfer.effectAllowed = 'move';
        setDraggingTopicId(topicId);
        
        // Criar uma imagem personalizada para o drag
        const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
        dragImage.style.opacity = '0.8';
        dragImage.style.transform = 'rotate(3deg)';
        document.body.appendChild(dragImage);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        e.dataTransfer.setDragImage(dragImage, e.clientX - dragImage.getBoundingClientRect().left, e.clientY - dragImage.getBoundingClientRect().top);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragEnd = () => {
        setDraggingTopicId(null);
        setDraggingOverDay(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, toDia: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        // Calcular posição de drop mais precisa
        const dropZone = e.currentTarget as HTMLElement;
        const cards = Array.from(dropZone.querySelectorAll('[draggable="true"]:not([data-dragging="true"])'));
        const dropY = e.clientY;
        const dropZoneRect = dropZone.getBoundingClientRect();
        
        let toIndex = cards.length;
        
        // Verificar se está sobre um card específico
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i] as HTMLElement;
            const cardRect = card.getBoundingClientRect();
            const cardMiddle = cardRect.top + cardRect.height / 2;
            
            if (dropY < cardMiddle) {
                toIndex = i;
                break;
            }
        }
        
        setDraggingOverDay(toDia);
        setDragOverIndex(toIndex);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Só limpar se realmente saiu da área (não apenas de um filho)
        const relatedTarget = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;
        
        if (!currentTarget.contains(relatedTarget)) {
            setDraggingOverDay(null);
            setDragOverIndex(null);
        }
    };

    const handleMoveTopico = (topicId: string, fromDia: string, toDia: string, fromIndex: number, toIndex: number) => {
        const newTrilha = JSON.parse(JSON.stringify(trilha));
        let itemToMove = topicId;
        if (fromDia !== 'backlog') {
            const sourceColumn = newTrilha[fromDia];
            [itemToMove] = sourceColumn.splice(fromIndex, 1);
        }
        const destinationColumn = newTrilha[toDia];
        destinationColumn.splice(toIndex, 0, itemToMove);
        
        setTrilhaCompleta(newTrilha);
        
        // Salvar trilha da semana
        setTrilhaSemana(weekKey, newTrilha);
    };

    const handleDrop = (e: React.DragEvent, toDia: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        setDraggingOverDay(null);
        setDragOverIndex(null);
        setDraggingTopicId(null);
        
        try {
            const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!draggedData) return;

            const { topicId, fromDia, fromIndex } = draggedData;

            const dropZone = e.currentTarget as HTMLElement;
            const cards = Array.from(dropZone.querySelectorAll('[draggable="true"]:not([data-dragging="true"])'));
            const dropY = e.clientY;

            let toIndex = cards.length;
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i] as HTMLElement;
                const cardRect = card.getBoundingClientRect();
                if (dropY < cardRect.top + cardRect.height / 2) {
                    toIndex = i;
                    break;
                }
            }

            if (fromDia === toDia && fromIndex === toIndex) return;

            handleMoveTopico(topicId, fromDia, toDia, fromIndex, toIndex);
        } catch (error) {
            console.error("Failed to parse dragged data:", error);
        }
    };
    
    // FIX: Explicitly type `day` to resolve `unknown` type error from Object.values inference.
    const isPlanoVazio = Object.values(topicsByDay).every((day: DraggableTopic[]) => day.length === 0);

    const adicionarTopicosAoDia = () => {
        if (!diaParaAdicionar || topicosSelecionados.size === 0) return;
        
        const newTrilha = JSON.parse(JSON.stringify(trilha));
        if (!newTrilha[diaParaAdicionar]) {
            newTrilha[diaParaAdicionar] = [];
        }
        
        // Permite tópicos repetidos - adiciona todos os selecionados
        const adicionados: string[] = [];
        topicosSelecionados.forEach(topicId => {
            newTrilha[diaParaAdicionar].push(topicId);
            adicionados.push(topicId);
        });
        
        setTrilhaCompleta(newTrilha);
        
        // Salvar trilha da semana
        setTrilhaSemana(weekKey, newTrilha);
        
        const diaNome = DIAS_SEMANA.find(d => d.id === diaParaAdicionar)?.nome;
        toast.success(`${adicionados.length} tópico${adicionados.length > 1 ? 's' : ''} adicionado${adicionados.length > 1 ? 's' : ''} em ${diaNome}!`);
        
        setTopicosSelecionados(new Set());
        setModalAdicionarAberto(false);
        setDiaParaAdicionar(null);
    };
    
    const toggleTopicoSelecionado = (topicId: string) => {
        setTopicosSelecionados(prev => {
            const novo = new Set(prev);
            if (novo.has(topicId)) {
                novo.delete(topicId);
            } else {
                novo.add(topicId);
            }
            return novo;
        });
    };
    
    const abrirModalAdicionar = (diaId: string) => {
        setDiaParaAdicionar(diaId);
        setTopicosSelecionados(new Set());
        setBuscaModal('');
        setDisciplinaFiltro(null);
        setModalAdicionarAberto(true);
    };

    const removerTopicoDoDia = (topicId: string, diaId: string) => {
        const newTrilha = JSON.parse(JSON.stringify(trilha));
        if (newTrilha[diaId]) {
            const topico = allTopicsMap.get(topicId);
            newTrilha[diaId] = newTrilha[diaId].filter((id: string) => id !== topicId);
            setTrilhaCompleta(newTrilha);
            
            // Salvar trilha da semana
            const weekKey = getWeekKey(semanaAtual);
            setTrilhaSemana(weekKey, newTrilha);
            
            toast.success(`Tópico "${topico?.titulo || 'removido'}" removido de ${DIAS_SEMANA.find(d => d.id === diaId)?.nome}`);
        }
    };

    // Não precisa mais verificar tópicos já adicionados - permite repetição

    // Filtrar tópicos no modal
    const topicosFiltrados = useMemo(() => {
        if (!disciplinas || disciplinas.length === 0) return [];
        
        return disciplinas
            .filter(d => !disciplinaFiltro || d.id === disciplinaFiltro)
            .map(disciplina => ({
                disciplina,
                topicos: (disciplina.topicos || []).filter(topico => {
                    const matchBusca = buscaModal.trim() === '' || 
                        topico.titulo.toLowerCase().includes(buscaModal.toLowerCase()) ||
                        disciplina.nome.toLowerCase().includes(buscaModal.toLowerCase());
                    return matchBusca;
                })
            }))
            .filter(item => item.topicos.length > 0);
    }, [disciplinas, buscaModal, disciplinaFiltro]);

    const selecionarTodosTopicos = () => {
        const todos = topicosFiltrados.flatMap(item => item.topicos.map(t => t.id));
        setTopicosSelecionados(new Set(todos));
    };

    const deselecionarTodos = () => {
        setTopicosSelecionados(new Set());
    };

    // Fechar modal com ESC
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modalAdicionarAberto) {
                setModalAdicionarAberto(false);
                setDiaParaAdicionar(null);
                setTopicosSelecionados(new Set());
                setBuscaModal('');
                setDisciplinaFiltro(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [modalAdicionarAberto]);

    return (
        <div data-tutorial="planejamento-content" className="flex flex-col h-full overflow-hidden">
            <header className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 border-b border-muted/50 flex-shrink-0">
                {/* Título e Botão IA - Responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <FootprintsIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary flex-shrink-0" />
                            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Trilha Semanal</h1>
                        </div>
                        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">Organize seus estudos arrastando os tópicos para os dias da semana.</p>
                    </div>
                    <button 
                        onClick={openGeradorPlanoModal} 
                        className="w-full sm:w-auto h-9 sm:h-10 px-3 sm:px-4 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                        <SparklesIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Gerar Plano com IA</span>
                        <span className="sm:hidden">IA</span>
                    </button>
                </div>
                
                {/* Navegação de semanas - Responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <button
                            onClick={() => navegarSemana('anterior')}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                            title="Semana anterior"
                            aria-label="Semana anterior"
                        >
                            <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                                <span className="hidden md:inline">
                                    {format(semanaAtual, "dd 'de' MMMM", { locale: ptBR })} - {format(endOfWeek(semanaAtual, { weekStartsOn: 1 }), "dd 'de' MMMM", { locale: ptBR })}
                                </span>
                                <span className="md:hidden">
                                    {format(semanaAtual, "dd/MM", { locale: ptBR })} - {format(endOfWeek(semanaAtual, { weekStartsOn: 1 }), "dd/MM", { locale: ptBR })}
                                </span>
                            </span>
                            {isSemanaAtual && (
                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium flex-shrink-0">
                                    Esta semana
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => navegarSemana('proxima')}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                            title="Próxima semana"
                            aria-label="Próxima semana"
                        >
                            <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {!isSemanaAtual && (
                            <button 
                                onClick={irParaSemanaAtual}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded-lg bg-muted hover:bg-muted/80 transition-colors flex-shrink-0"
                                title="Voltar para semana atual"
                            >
                                Hoje
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Estatísticas gerais - Responsivo */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm mt-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-muted-foreground whitespace-nowrap">Total:</span>
                        <span className="font-semibold whitespace-nowrap">{estatisticas.total} tópicos</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-muted-foreground whitespace-nowrap">Concluídos:</span>
                        <span className="font-semibold text-green-500 whitespace-nowrap">{estatisticas.concluidos}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-muted-foreground whitespace-nowrap">Pendentes:</span>
                        <span className="font-semibold text-orange-500 whitespace-nowrap">{estatisticas.pendentes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-muted-foreground whitespace-nowrap">Progresso:</span>
                        <span className="font-semibold text-primary whitespace-nowrap">{estatisticas.progresso}%</span>
                    </div>
                </div>
            </header>
            <div className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 overflow-x-auto overflow-y-hidden">
                {/* Layout Responsivo: Grid flexível que se adapta ao tamanho da tela */}
                <div className="max-w-[1400px] mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 sm:gap-4 w-full items-start">
                        {DIAS_SEMANA.map(dia => {
                            const stats = estatisticasPorDia[dia.id];
                            const carga = stats.total === 0 ? 'vazio' : stats.total <= 3 ? 'leve' : stats.total <= 6 ? 'medio' : 'pesado';
                            const isDiaAtual = isSemanaAtual && normalizarDia(dia.nome) === diaAtualNormalizado;
                            const dropZoneActive = draggingOverDay === dia.id;
                            return (
                                <div
                                    key={dia.id}
                                    className={`flex h-[calc(100vh-200px)] flex-col transition-all duration-300 ${
                                        isDiaAtual ? 'scale-[1.02]' : ''
                                    }`}
                                >
                                    <div
                                        className={`mb-2 sm:mb-3 rounded-xl p-2 sm:p-3 transition-all duration-300 ${
                                            isDiaAtual
                                                ? 'bg-indigo-50/30 dark:bg-indigo-900/20 border border-indigo-500 shadow-lg shadow-indigo-200/20 dark:shadow-indigo-900/20'
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h3
                                                    className={`font-bold text-sm sm:text-base transition-colors duration-300 ${
                                                        isDiaAtual ? 'text-indigo-600 dark:text-indigo-400' : 'text-foreground'
                                                    }`}
                                                >
                                                    {dia.nome}
                                                </h3>
                                                {isDiaAtual && (
                                                    <span className="text-[10px] sm:text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-medium">
                                                        Hoje
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                                    carga === 'vazio'
                                                        ? 'bg-muted text-muted-foreground'
                                                        : carga === 'leve'
                                                        ? 'bg-green-500/20 text-green-600 dark:text-green-500'
                                                        : carga === 'medio'
                                                        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                                                        : 'bg-red-500/20 text-red-600 dark:text-red-500'
                                                }`}
                                            >
                                                {stats.total}
                                            </span>
                                        </div>
                                        {stats.total > 0 && (
                                            <div className="w-full h-1 sm:h-1.5 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-300"
                                                    style={{ width: `${stats.progresso}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div
                                        className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border-2 transition-all duration-200 ${
                                            dropZoneActive
                                                ? 'border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20'
                                                : 'border-border/20 bg-card/40 hover:border-primary/40'
                                        }`}
                                        onDragOver={(e) => handleDragOver(e, dia.id)}
                                        onDrop={(e) => handleDrop(e, dia.id)}
                                        onDragEnter={() => setDraggingOverDay(dia.id)}
                                        onDragLeave={handleDragLeave}
                                    >
                                        {topicsByDay[dia.id].length === 0 ? (
                                            <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
                                                <button
                                                    onClick={() => abrirModalAdicionar(dia.id)}
                                                    className="w-full rounded-xl border-2 border-dashed border-border bg-card/60 p-4 text-muted-foreground transition-all duration-200 hover:border-primary hover:text-primary hover:shadow-lg hover:shadow-primary/20"
                                                    title={`Adicionar tópicos em ${dia.nome}`}
                                                >
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                        <span className="text-xs sm:text-sm font-medium">Adicionar tópicos</span>
                                                    </div>
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 overflow-hidden p-2 sm:p-3">
                                                    <div className="h-full overflow-y-auto pr-1">
                                                        <div className="grid auto-rows-[160px] sm:auto-rows-[180px] gap-3 sm:gap-4">
                                                            {topicsByDay[dia.id].map((topic, index) => {
                                                                const isDragOver = draggingOverDay === dia.id && dragOverIndex === index;
                                                                const dragOverPosition = isDragOver ? 'above' : null;
                                                                return (
                                                                    <TopicCard
                                                                        key={`${topic.id}-${index}`}
                                                                        topic={topic}
                                                                        isDragging={draggingTopicId === topic.id}
                                                                        isDragOver={isDragOver}
                                                                        dragOverPosition={dragOverPosition}
                                                                        onDragStart={(e) => handleDragStart(e, topic.id, dia.id, index)}
                                                                        onDragEnd={handleDragEnd}
                                                                        onRemove={(topicId) => removerTopicoDoDia(topicId, dia.id)}
                                                                        onToggleConcluido={() => {
                                                                            toggleTopicoConcluidoNaTrilha(weekKey, dia.id, topic.id);
                                                                        }}
                                                                        onPreviewOpen={() => openPreview(topic, dia.nome)}
                                                                        onPreviewClose={schedulePreviewClose}
                                                                        onPreviewCancelClose={cancelPreviewClose}
                                                                        isAnyDragging={Boolean(draggingTopicId)}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-center border-t border-border/60 bg-card/50 px-2 py-2 sm:px-3">
                                                    <button
                                                        onClick={() => abrirModalAdicionar(dia.id)}
                                                        className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                                                        title={`Adicionar mais tópicos em ${dia.nome}`}
                                                    >
                                                        <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                        <span>Adicionar</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                        {dropZoneActive && dragOverIndex === topicsByDay[dia.id].length && topicsByDay[dia.id].length > 0 && (
                                            <div className="pointer-events-none absolute inset-x-4 bottom-16 h-1 rounded-full bg-primary/80 shadow-[0_0_12px_rgba(99,102,241,0.45)] animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {activePreview && (
                <TopicPreviewOverlay
                    data={activePreview}
                    onClose={closePreviewImmediately}
                    onKeepOpen={cancelPreviewClose}
                    onScheduleClose={schedulePreviewClose}
                />
            )}

            {/* Modal para adicionar tópicos - Responsivo */}
            {modalAdicionarAberto && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4" onClick={() => {
                    setModalAdicionarAberto(false);
                    setDiaParaAdicionar(null);
                    setTopicosSelecionados(new Set());
                    setBuscaModal('');
                    setDisciplinaFiltro(null);
                }}>
                    <div className="bg-card border-2 border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-3 sm:p-4 border-b border-border flex items-start sm:items-center justify-between gap-2 flex-shrink-0">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold truncate">Adicionar Tópicos</h2>
                                {diaParaAdicionar && (
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                                        Para: {DIAS_SEMANA.find(d => d.id === diaParaAdicionar)?.nome}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setModalAdicionarAberto(false);
                                    setDiaParaAdicionar(null);
                                    setTopicosSelecionados(new Set());
                                    setBuscaModal('');
                                    setDisciplinaFiltro(null);
                                }}
                                className="p-1.5 sm:p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                                aria-label="Fechar modal"
                            >
                                <XIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                        
                        {/* Filtros e busca */}
                        <div className="p-3 sm:p-4 border-b border-border space-y-2 sm:space-y-3 flex-shrink-0">
                            <div className="relative">
                                <SearchIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={buscaModal}
                                    onChange={(e) => setBuscaModal(e.target.value)}
                                    placeholder="Buscar tópicos ou disciplinas..."
                                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <button
                                    onClick={() => setDisciplinaFiltro(null)}
                                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                                        disciplinaFiltro === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    Todas
                                </button>
                                {disciplinas && disciplinas.length > 0 ? (
                                    disciplinas.map(d => (
                                        <button
                                            key={d.id}
                                            onClick={() => setDisciplinaFiltro(d.id)}
                                            className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-colors truncate max-w-[150px] sm:max-w-none ${
                                                disciplinaFiltro === d.id
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }`}
                                        >
                                            {d.nome}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">Nenhuma disciplina disponível</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <button
                                    onClick={selecionarTodosTopicos}
                                    className="text-[10px] sm:text-xs text-primary hover:underline"
                                >
                                    Selecionar todos
                                </button>
                                <span className="text-muted-foreground">•</span>
                                <button
                                    onClick={deselecionarTodos}
                                    className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Desmarcar todos
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
                            <div className="space-y-3 sm:space-y-4">
                                {topicosFiltrados.map(({ disciplina, topicos }) => (
                                    <div key={disciplina.id} className="border border-border rounded-lg p-2 sm:p-3">
                                        <h3 className="font-semibold mb-2 text-foreground text-sm sm:text-base">{disciplina.nome}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {topicos.map((topico, index) => {
                                                const isSelected = topicosSelecionados.has(topico.id);
                                                return (
                                                    <button
                                                        key={`${topico.id}-${index}`}
                                                        onClick={() => toggleTopicoSelecionado(topico.id)}
                                                        className={`text-left p-2 rounded border-2 transition-all relative ${
                                                            isSelected 
                                                                ? 'border-primary bg-primary/10 shadow-sm' 
                                                                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-xs sm:text-sm text-foreground truncate flex-1">{topico.titulo}</span>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {isSelected && (
                                                                    <CheckIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {topicos.length === 0 && (
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">Nenhum tópico encontrado</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {topicosFiltrados.length === 0 && (
                                <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                    {disciplinas.length === 0 ? (
                                        <>
                                            <p className="text-sm sm:text-base">Nenhuma disciplina cadastrada.</p>
                                            <p className="text-xs sm:text-sm mt-2">Adicione disciplinas primeiro.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm sm:text-base">Nenhum tópico encontrado.</p>
                                            <p className="text-xs sm:text-sm mt-2">Tente ajustar os filtros de busca.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm text-muted-foreground">
                                    {topicosSelecionados.size > 0 
                                        ? `${topicosSelecionados.size} tópico${topicosSelecionados.size > 1 ? 's' : ''} selecionado${topicosSelecionados.size > 1 ? 's' : ''}`
                                        : 'Selecione os tópicos para adicionar'
                                    }
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setModalAdicionarAberto(false);
                                        setDiaParaAdicionar(null);
                                        setTopicosSelecionados(new Set());
                                    }}
                                    className="px-3 sm:px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={adicionarTopicosAoDia}
                                    disabled={topicosSelecionados.size === 0}
                                    className="px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                                >
                                    <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span>Adicionar ({topicosSelecionados.size})</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrilhaSemanal;