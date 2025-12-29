import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEditalStore } from '../stores/useEditalStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { FootprintsIcon, CheckIcon, PlayIcon, PlusIcon, XIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import {
    CalendarDaysIcon,
    GripVerticalIcon,
    Trash2Icon,
    ClockIcon,
    SparklesIcon,
    ArrowRightIcon,
    TargetIcon,
    FlameIcon,
    ArrowLeftIcon
} from './icons';
import { useModalStore } from '../stores/useModalStore';
import { toast } from './Sonner';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, isSameWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DIAS_SEMANA, DraggableTopic } from './TrilhaSemanal/types';
import DayColumn from './TrilhaSemanal/DayColumn';
import { DndContext, rectIntersection, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { sortTopicosPorNumero } from '../utils/sortTopicos';
import PremiumFeatureWrapper from './PremiumFeatureWrapper';

// Função para normalizar strings (remover acentos e converter para minúsculas)
const normalizarDia = (s: string) => {
    // Extrair apenas a primeira palavra (antes do hífen, se houver)
    const primeiraPalavra = s.split('-')[0].trim();
    return primeiraPalavra.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

const TrilhaSemanal: React.FC = () => {
    const navigate = useNavigate();

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
        loadTrilhaSemanal,
        gerarTrilhaComIA, // Added for AI Planning
        loading: loadingEstudos // Added for AI Planning
    } = useEstudosStore();
    const disciplinasStore = useDisciplinasStore(state => state.disciplinas); // Renamed to avoid conflict
    const { editalAtivo } = useEditalStore();
    const { revisoes, fetchRevisoes } = useRevisoesStore();
    const { planType, canAccessPlanning, hasActiveSubscription, isTrialActive } = useSubscriptionStore();

    const isActive = hasActiveSubscription() || isTrialActive();
    const isLocked = !canAccessPlanning();

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
    const [revisoesSelecionadas, setRevisoesSelecionadas] = useState<Set<string>>(new Set());
    const [abaAtiva, setAbaAtiva] = useState<'topicos' | 'revisoes'>('topicos');
    const [buscaModal, setBuscaModal] = useState('');
    const [buscaModalDebounced, setBuscaModalDebounced] = useState('');
    const [disciplinaFiltro, setDisciplinaFiltro] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [dragOverDia, setDragOverDia] = useState<string | null>(null);

    // AI Planning State
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiStep, setAiStep] = useState(1);
    const [aiConfig, setAiConfig] = useState({
        horasPorDia: 4,
        nivel: 'intermediario',
        foco: 'equilibrado',
        materiasSelecionadas: [] as string[]
    });

    const disciplinas = disciplinasStore || [];

    // Initialize selected subjects ONLY when modal opens (not when user deselects)
    useEffect(() => {
        if (isAiModalOpen && disciplinas.length > 0 && aiConfig.materiasSelecionadas.length === 0) {
            setAiConfig(prev => ({
                ...prev,
                materiasSelecionadas: disciplinas.map(d => d.id)
            }));
        }
    }, [isAiModalOpen, disciplinas.length]); // Removido aiConfig.materiasSelecionadas.length!


    const handleOpenAiPlanning = () => {
        if (!canAccessPlanning()) {
            toast.error("Funcionalidade exclusiva para assinantes Premium! 💎");
            return;
        }
        setIsAiModalOpen(true);
        setAiStep(1);
    };

    const handleGenerateAiParams = async () => {
        if (aiConfig.materiasSelecionadas.length === 0) {
            toast.error("Selecione pelo menos uma matéria.");
            return;
        }

        await gerarTrilhaComIA({
            horasPorDia: aiConfig.horasPorDia,
            materias: aiConfig.materiasSelecionadas,
            nivel: aiConfig.nivel,
            foco: aiConfig.foco
        });
        setIsAiModalOpen(false);
    };

    const toggleMateriaSelection = (id: string) => {
        setAiConfig(prev => {
            const isSelected = prev.materiasSelecionadas.includes(id);
            return {
                ...prev,
                materiasSelecionadas: isSelected
                    ? prev.materiasSelecionadas.filter(m => m !== id)
                    : [...prev.materiasSelecionadas, id]
            };
        });
    };

    // Configurar sensores para drag & drop com menor distância de ativação
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

    const createInstanceId = (diaId: string, index: number) => `${diaId}__${index}`;
    const parseInstanceId = (instanceId: string) => {
        const [diaId, indexStr] = instanceId.split('__');
        if (!diaId || indexStr === undefined) return null;
        const index = Number(indexStr);
        if (Number.isNaN(index)) return null;
        return { diaId, index } as const;
    };

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
        if (!disciplinasStore || disciplinasStore.length === 0) return [];
        return disciplinasStore.flatMap(d =>
            (d.topicos || []).map(t => ({ ...t, disciplinaNome: d.nome, disciplinaId: d.id }))
        );
    }, [disciplinasStore]);

    const allTopicsMap = useMemo(() => new Map(allTopics.map(t => [t.id, t])), [allTopics]);

    const topicsByDay = useMemo(() => {
        const result: { [key: string]: DraggableTopic[] } = {};
        for (const dia of DIAS_SEMANA) {
            const topicos = (trilha[dia.id] || []).map((topicId, index) => {
                let topico: DraggableTopic | undefined;

                // Tentar fazer parse se for string JSON (Item gerado por IA)
                if (topicId.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(topicId);
                        // Tentar encontrar nome da disciplina
                        const disc = disciplinasStore?.find(d => d.id === parsed.disciplinaId);

                        topico = {
                            ...parsed,
                            disciplinaNome: disc?.nome || parsed.disciplinaId || 'Geral', // Fallback
                            // Campos obrigatórios do DraggableTopic que podem faltar no JSON da IA
                            concluido: false,
                            nivelDificuldade: 'médio',
                            ultimaRevisao: null,
                            proximaRevisao: null,
                            // Campos adicionais
                            isAiGenerated: true
                        } as DraggableTopic;
                    } catch (e) {
                        console.error("Failed to parse AI topic", e);
                    }
                }

                // Se não for IA ou falhou o parse, tenta buscar no mapa padrão
                if (!topico) {
                    topico = allTopicsMap.get(topicId);
                }

                if (!topico) return null;

                const instanceId = createInstanceId(dia.id, index);
                // Usar topico.id para verificar conclusão (funciona para IA e normal)
                const concluidoNaTrilha = isTopicoConcluidoNaTrilha(weekKey, dia.id, topico.id);
                return { ...topico, concluidoNaTrilha, instanceId, occurrenceIndex: index } as DraggableTopic;
            }).filter((t): t is DraggableTopic => !!t);
            const pendentes = topicos.filter(t => !t.concluidoNaTrilha);
            const concluidos = topicos.filter(t => t.concluidoNaTrilha);
            result[dia.id] = [...pendentes, ...concluidos];
        }
        return result;
    }, [trilha, allTopicsMap, weekKey, isTopicoConcluidoNaTrilha, trilhaConclusao, disciplinasStore]);

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

    // Handler para quando o drag começa
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // Handler para quando está arrastando (efeito ímã)
    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (over) {
            const overIdStr = over.id as string;
            setOverId(overIdStr);

            if (overIdStr.startsWith('droppable-')) {
                const diaId = overIdStr.replace('droppable-', '');
                setDragOverDia(diaId);
            } else {
                const info = parseInstanceId(overIdStr);
                setDragOverDia(info?.diaId || null);
            }
        } else {
            setOverId(null);
            setDragOverDia(null);
        }
    };

    // Handler para quando o drag termina
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || !active) {
            setActiveId(null);
            return;
        }

        const activeInstanceId = active.id as string;
        const overInstanceId = over.id as string;

        const activeInfo = parseInstanceId(activeInstanceId);
        if (!activeInfo) {
            setActiveId(null);
            return;
        }

        const { diaId: fromDia, index: fromIndex } = activeInfo;
        const topicId = trilha[fromDia]?.[fromIndex];
        if (!topicId) {
            setActiveId(null);
            return;
        }

        const newTrilha = JSON.parse(JSON.stringify(trilha));
        const sourceColumn = newTrilha[fromDia];
        if (!sourceColumn) {
            setActiveId(null);
            return;
        }

        let targetDia = fromDia;
        let targetIndex: number | null = null;

        if (overInstanceId.startsWith('droppable-')) {
            targetDia = overInstanceId.replace('droppable-', '');
            targetIndex = newTrilha[targetDia]?.length ?? 0;
        } else if (overInstanceId === activeInstanceId) {
            setActiveId(null);
            setOverId(null);
            setDragOverDia(null);
            return;
        } else {
            const targetInfo = parseInstanceId(overInstanceId);
            if (targetInfo) {
                targetDia = targetInfo.diaId;
                targetIndex = targetInfo.index;
            }
        }

        if (!newTrilha[targetDia]) {
            newTrilha[targetDia] = [];
        }

        const [movedTopic] = sourceColumn.splice(fromIndex, 1);
        if (!movedTopic) {
            setActiveId(null);
            return;
        }

        newTrilha[fromDia] = sourceColumn;

        const destinationColumn = newTrilha[targetDia];
        let insertionIndex = targetIndex ?? destinationColumn.length;

        if (fromDia === targetDia && insertionIndex > fromIndex) {
            insertionIndex -= 1;
        }

        if (insertionIndex < 0) {
            insertionIndex = 0;
        }
        if (insertionIndex > destinationColumn.length) {
            insertionIndex = destinationColumn.length;
        }

        destinationColumn.splice(insertionIndex, 0, movedTopic);
        newTrilha[targetDia] = destinationColumn;

        setTrilhaCompleta(newTrilha);
        setTrilhaSemana(weekKey, newTrilha);

        // Limpar estados
        setActiveId(null);
        setOverId(null);
        setDragOverDia(null);
    };

    // FIX: Explicitly type `day` to resolve `unknown` type error from Object.values inference.
    const isPlanoVazio = Object.values(topicsByDay).every((day: DraggableTopic[]) => day.length === 0);

    const adicionarTopicosAoDia = () => {
        if (!diaParaAdicionar) return;

        const totalSelecionado = topicosSelecionados.size + revisoesSelecionadas.size;
        if (totalSelecionado === 0) return;

        const newTrilha = JSON.parse(JSON.stringify(trilha));
        if (!newTrilha[diaParaAdicionar]) {
            newTrilha[diaParaAdicionar] = [];
        }

        const adicionados: string[] = [];

        // Adicionar tópicos selecionados
        topicosSelecionados.forEach(topicId => {
            newTrilha[diaParaAdicionar].push(topicId);
            adicionados.push(topicId);
        });

        // Adicionar revisões selecionadas (usando o topico_id da revisão)
        revisoesSelecionadas.forEach(revisaoId => {
            const revisao = revisoes.find(r => r.id === revisaoId);
            if (revisao) {
                const topicId = revisao.topico_id;
                newTrilha[diaParaAdicionar].push(topicId);
                adicionados.push(topicId);
            }
        });

        if (adicionados.length > 0) {
            setTrilhaCompleta(newTrilha);
            setTrilhaSemana(weekKey, newTrilha);

            const diaNome = DIAS_SEMANA.find(d => d.id === diaParaAdicionar)?.nome;
            const totalAdicionado = adicionados.length;
            const tipoTexto = topicosSelecionados.size > 0 && revisoesSelecionadas.size > 0
                ? 'itens'
                : topicosSelecionados.size > 0
                    ? 'tópico' + (totalAdicionado > 1 ? 's' : '')
                    : 'revisão' + (totalAdicionado > 1 ? 'ões' : '');

            const mensagem = `${totalAdicionado} ${tipoTexto} adicionado${totalAdicionado > 1 ? 's' : ''} em ${diaNome}!`;
            toast.success(mensagem);
        }

        setTopicosSelecionados(new Set());
        setRevisoesSelecionadas(new Set());
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

    const toggleRevisaoSelecionada = (revisaoId: string) => {
        setRevisoesSelecionadas(prev => {
            const novo = new Set(prev);
            if (novo.has(revisaoId)) {
                novo.delete(revisaoId);
            } else {
                novo.add(revisaoId);
            }
            return novo;
        });
    };

    const abrirModalAdicionar = (diaId: string) => {
        setDiaParaAdicionar(diaId);
        setTopicosSelecionados(new Set());
        setRevisoesSelecionadas(new Set());
        setBuscaModal('');
        setDisciplinaFiltro(null);
        setAbaAtiva('topicos');
        setModalAdicionarAberto(true);

        // Carregar revisões se houver edital ativo
        if (editalAtivo?.id) {
            fetchRevisoes(editalAtivo.id).catch(err => {
                console.error("Erro ao carregar revisões:", err);
            });
        }
    };

    const removerTopicoDoDia = (instanceId: string) => {
        const info = parseInstanceId(instanceId);
        if (!info) return;
        const { diaId, index } = info;
        const newTrilha = JSON.parse(JSON.stringify(trilha));
        if (newTrilha[diaId]) {
            const [removedTopicId] = newTrilha[diaId].splice(index, 1);
            setTrilhaCompleta(newTrilha);

            const weekKeyAtual = getWeekKey(semanaAtual);
            setTrilhaSemana(weekKeyAtual, newTrilha);

            const topico = removedTopicId ? allTopicsMap.get(removedTopicId) : null;
            toast.success(`Tópico "${topico?.titulo || 'removido'}" removido de ${DIAS_SEMANA.find(d => d.id === diaId)?.nome}`);
        }
    };

    // Filtrar tópicos no modal - permitir repetição em diferentes dias
    const topicosFiltrados = useMemo(() => {
        if (!disciplinas || disciplinas.length === 0) return [];

        return disciplinas
            .filter(d => !disciplinaFiltro || d.id === disciplinaFiltro)
            .map(disciplina => {
                const topicosFiltrados = (disciplina.topicos || []).filter(topico => {
                    // Verificar apenas busca (permitir repetição em diferentes dias)
                    const matchBusca = buscaModalDebounced.trim() === '' ||
                        topico.titulo.toLowerCase().includes(buscaModalDebounced.toLowerCase()) ||
                        disciplina.nome.toLowerCase().includes(buscaModalDebounced.toLowerCase());
                    return matchBusca;
                });

                // Ordenar tópicos por número
                const topicosOrdenados = sortTopicosPorNumero(topicosFiltrados);

                return {
                    disciplina,
                    topicos: topicosOrdenados
                };
            })
            .filter(item => item.topicos.length > 0);
    }, [disciplinas, buscaModalDebounced, disciplinaFiltro]);

    // Filtrar revisões no modal
    const revisoesFiltradas = useMemo(() => {
        if (!revisoes || revisoes.length === 0) return [];

        // Filtrar apenas revisões pendentes ou atrasadas
        const revisoesPendentes = revisoes.filter(r =>
            r.status === 'pendente' || r.status === 'atrasada'
        );

        // Aplicar filtro de disciplina
        let revisoesFiltradas = revisoesPendentes;
        if (disciplinaFiltro) {
            revisoesFiltradas = revisoesPendentes.filter(r => r.disciplinaId === disciplinaFiltro);
        }

        // Aplicar busca
        if (buscaModalDebounced.trim() !== '') {
            const buscaLower = buscaModalDebounced.toLowerCase();
            revisoesFiltradas = revisoesFiltradas.filter(r => {
                const topico = allTopicsMap.get(r.topico_id);
                const disciplina = disciplinas.find(d => d.id === r.disciplinaId);
                return (
                    r.conteudo.toLowerCase().includes(buscaLower) ||
                    topico?.titulo.toLowerCase().includes(buscaLower) ||
                    disciplina?.nome.toLowerCase().includes(buscaLower)
                );
            });
        }

        // Agrupar por disciplina
        const revisoesPorDisciplina = revisoesFiltradas.reduce((acc, revisao) => {
            const disciplina = disciplinas.find(d => d.id === revisao.disciplinaId);
            if (!disciplina) return acc;

            if (!acc[disciplina.id]) {
                acc[disciplina.id] = {
                    disciplina,
                    revisoes: []
                };
            }
            acc[disciplina.id].revisoes.push(revisao);
            return acc;
        }, {} as Record<string, { disciplina: typeof disciplinas[0]; revisoes: typeof revisoes }>);

        return Object.values(revisoesPorDisciplina).filter(item => item.revisoes.length > 0);
    }, [revisoes, buscaModalDebounced, disciplinaFiltro, disciplinas, allTopicsMap]);

    const selecionarTodosTopicos = () => {
        if (abaAtiva === 'topicos') {
            const todos = topicosFiltrados.flatMap(item => item.topicos.map(t => t.id));
            setTopicosSelecionados(new Set(todos));
        } else {
            const todas = revisoesFiltradas.flatMap(item => item.revisoes.map(r => r.id));
            setRevisoesSelecionadas(new Set(todas));
        }
    };

    const deselecionarTodos = () => {
        if (abaAtiva === 'topicos') {
            setTopicosSelecionados(new Set());
        } else {
            setRevisoesSelecionadas(new Set());
        }
    };

    // Debounce na busca do modal
    useEffect(() => {
        const timer = setTimeout(() => {
            setBuscaModalDebounced(buscaModal);
        }, 300);
        return () => clearTimeout(timer);
    }, [buscaModal]);

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
        <PremiumFeatureWrapper
            isLocked={isLocked}
            requiredPlan="pro"
            feature="Planejamento Semanal"
            blurAmount="lg"
        >
            <div data-tutorial="planejamento-content" className="flex flex-col h-full overflow-hidden bg-background">
                <div className="flex flex-1 justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
                    <div className="flex w-full max-w-screen-2xl flex-col gap-6 h-full overflow-hidden">
                        {/* Título e Botão IA */}
                        <div className="px-2 flex-shrink-0 flex items-center justify-between gap-4">
                            <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
                                Trilha de Estudos Semanal
                            </h1>
                            <button
                                onClick={handleOpenAiPlanning}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                                title="Gerar planejamento semanal com IA"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">Planejar com IA</span>
                            </button>
                        </div>

                        {/* Navegação de semanas com tabs */}
                        <div className="px-2 flex-shrink-0">
                            <div className="flex border-b border-border-light dark:border-border-dark">
                                <button
                                    onClick={() => navegarSemana('anterior')}
                                    className="flex items-center justify-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-text-muted-light dark:text-text-muted-dark hover:border-slate-400 hover:text-text-dark dark:hover:border-slate-500 dark:hover:text-slate-200 transition-colors"
                                >
                                    <ChevronLeftIcon className="w-4 h-4" />
                                    <span>Semana Anterior</span>
                                </button>
                                <button
                                    onClick={irParaSemanaAtual}
                                    className={`flex items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${isSemanaAtual
                                        ? 'border-vibrant-blue text-vibrant-blue'
                                        : 'border-transparent text-text-muted-light dark:text-text-muted-dark hover:border-slate-400 hover:text-text-dark dark:hover:border-slate-500 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <span>Semana Atual</span>
                                </button>
                                <button
                                    onClick={() => navegarSemana('proxima')}
                                    className="flex items-center justify-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-text-muted-light dark:text-text-muted-dark hover:border-slate-400 hover:text-text-dark dark:hover:border-slate-500 dark:hover:text-slate-200 transition-colors"
                                >
                                    <span>Próxima Semana</span>
                                    <ChevronRightIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Painel de Progresso da Semana (Horizontal no Topo) */}
                        <div className="px-2 flex-shrink-0">
                            <div className="flex flex-col md:flex-row items-center gap-6 rounded-xl bg-module-bg-light dark:bg-module-bg-dark p-6 shadow-subtle dark:shadow-subtle-dark">
                                <div className="flex-shrink-0">
                                    <h2 className="text-lg font-bold leading-tight tracking-tight text-text-dark dark:text-text-light mb-1">
                                        Progresso da Semana
                                    </h2>
                                    <p className="text-sm font-medium text-text-muted-light dark:text-text-muted-dark">
                                        {estatisticas.concluidos} de {estatisticas.total} tópicos completos
                                    </p>
                                </div>

                                <div className="flex-1 w-full flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                                <span className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Total: {estatisticas.total}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-success"></div>
                                                <span className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Concluídos: {estatisticas.concluidos}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-accent"></div>
                                                <span className="text-xs font-semibold text-text-muted-light dark:text-text-muted-dark uppercase tracking-wider">Pendentes: {estatisticas.pendentes}</span>
                                            </div>
                                        </div>
                                        <p className="text-xl font-black text-text-dark dark:text-text-light">
                                            {estatisticas.progresso}%
                                        </p>
                                    </div>
                                    <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-accent transition-all duration-700 ease-out shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                                            style={{ width: `${estatisticas.progresso}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grid de dias da semana (Largura Total - 2 Colunas) */}
                        <main className="flex-1 overflow-y-auto min-h-0 px-2">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 min-h-full pb-8">
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={rectIntersection}
                                    onDragStart={handleDragStart}
                                    onDragOver={handleDragOver}
                                    onDragEnd={handleDragEnd}
                                >
                                    {DIAS_SEMANA.map((dia, index) => {
                                        const stats = estatisticasPorDia[dia.id];
                                        const isDiaAtual = isSemanaAtual && normalizarDia(dia.nome) === diaAtualNormalizado;
                                        // Calcular a data específica para este dia
                                        // A semana começa na segunda (index 0)
                                        const date = addDays(semanaAtual, index);

                                        return (
                                            <DayColumn
                                                key={dia.id}
                                                dia={dia}
                                                date={date}
                                                topics={topicsByDay[dia.id]}
                                                stats={stats}
                                                isDiaAtual={isDiaAtual}
                                                onRemove={removerTopicoDoDia}
                                                onToggleConcluido={(topicId) => toggleTopicoConcluidoNaTrilha(weekKey, dia.id, topicId)}
                                                onAddTopics={abrirModalAdicionar}
                                                activeId={activeId}
                                                dragOverDia={dragOverDia}
                                                overId={overId}
                                            />
                                        );
                                    })}
                                </DndContext>
                            </div>
                        </main>
                    </div>
                </div>

                {/* AI Planning Modal */}
                {isAiModalOpen && (
                    <div
                        className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4"
                        onClick={() => setIsAiModalOpen(false)}
                    >
                        <div
                            className="bg-card border-2 border-white/10 rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="p-3 sm:p-4 border-b border-border flex items-start sm:items-center justify-between gap-2 flex-shrink-0">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                                        <SparklesIcon className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg sm:text-xl font-bold truncate">Planejamento Inteligente</h2>
                                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                                            {aiStep === 1 ? 'Passo 1 de 2: Preferências' : 'Passo 2 de 2: Matérias'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsAiModalOpen(false)}
                                    className="p-1.5 sm:p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                                    aria-label="Fechar modal"
                                >
                                    <XIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 max-h-[60vh] overflow-y-auto">
                                {aiStep === 1 ? (
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <ClockIcon className="w-4 h-4 text-primary" />
                                                Horas por dia
                                            </label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="range"
                                                    min="1" max="12"
                                                    value={aiConfig.horasPorDia}
                                                    onChange={(e) => setAiConfig({ ...aiConfig, horasPorDia: parseInt(e.target.value) })}
                                                    className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                                />
                                                <span className="w-12 text-center font-bold bg-muted px-2 py-1 rounded-md">
                                                    {aiConfig.horasPorDia}h
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <TargetIcon className="w-4 h-4 text-primary" />
                                                Nível de Conhecimento
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['iniciante', 'intermediario', 'avancado'].map((opt) => (
                                                    <button
                                                        key={opt}
                                                        onClick={() => setAiConfig({ ...aiConfig, nivel: opt })}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all border ${aiConfig.nivel === opt
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'bg-muted/50 border-transparent hover:bg-muted text-muted-foreground'
                                                            }`}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-sm font-medium flex items-center gap-2">
                                                <FlameIcon className="w-4 h-4 text-primary" />
                                                Foco da Semana
                                            </label>
                                            <select
                                                value={aiConfig.foco}
                                                onChange={(e) => setAiConfig({ ...aiConfig, foco: e.target.value })}
                                                className="w-full px-3 py-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value="equilibrado">⚖️ Equilibrado</option>
                                                <option value="teoria">📘 Foco em Teoria (Avançar Conteúdo)</option>
                                                <option value="questoes">📝 Foco em Questões (Prática)</option>
                                                <option value="revisao">🔄 Foco em Revisão</option>
                                                <option value="lei_seca">⚖️ Foco em Lei Seca</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium">Selecione as disciplinas:</span>
                                            <button
                                                onClick={() => {
                                                    const todasSelecionadas = aiConfig.materiasSelecionadas.length === disciplinas.length;
                                                    setAiConfig(prev => ({
                                                        ...prev,
                                                        materiasSelecionadas: todasSelecionadas ? [] : disciplinas.map(d => d.id)
                                                    }));
                                                }}
                                                className="text-xs text-primary hover:underline font-semibold"
                                            >
                                                {aiConfig.materiasSelecionadas.length === disciplinas.length
                                                    ? '✗ Desmarcar Todas'
                                                    : '✓ Marcar Todas'}
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {disciplinas.map(d => (
                                                <label key={d.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-muted transition-colors border border-transparent hover:border-primary/20">
                                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${aiConfig.materiasSelecionadas.includes(d.id)
                                                        ? 'bg-primary border-primary text-primary-foreground'
                                                        : 'border-muted-foreground/30 bg-background'
                                                        }`}>
                                                        {aiConfig.materiasSelecionadas.includes(d.id) && <CheckIcon className="w-3 h-3" />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={aiConfig.materiasSelecionadas.includes(d.id)}
                                                        onChange={() => toggleMateriaSelection(d.id)}
                                                    />
                                                    <span className="font-medium text-sm">{d.nome}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-border bg-muted/30 flex justify-between items-center">
                                {aiStep === 2 ? (
                                    <button
                                        onClick={() => setAiStep(1)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                        Voltar
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {aiStep === 1 ? (
                                    <button
                                        onClick={() => setAiStep(2)}
                                        className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-md hover:bg-primary/90 transition-all flex items-center gap-2"
                                    >
                                        Próximo
                                        <ArrowRightIcon className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleGenerateAiParams}
                                        disabled={loadingEstudos}
                                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loadingEstudos ? (
                                            <>
                                                <SparklesIcon className="w-4 h-4 animate-spin" />
                                                Gerando...
                                            </>
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-4 h-4" />
                                                Gerar Planejamento
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* Modal para adicionar tópicos - Responsivo */}
                {modalAdicionarAberto && (
                    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4" onClick={() => {
                        setModalAdicionarAberto(false);
                        setDiaParaAdicionar(null);
                        setTopicosSelecionados(new Set());
                        setRevisoesSelecionadas(new Set());
                        setBuscaModal('');
                        setDisciplinaFiltro(null);
                    }}>
                        <div className="bg-card border-2 border-white/10 rounded-lg shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                            <div className="p-3 sm:p-4 border-b border-border flex items-start sm:items-center justify-between gap-2 flex-shrink-0">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold truncate">Adicionar à Trilha</h2>
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

                            {/* Abas */}
                            <div className="px-3 sm:px-4 border-b border-border flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => setAbaAtiva('topicos')}
                                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${abaAtiva === 'topicos'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Tópicos
                                </button>
                                <button
                                    onClick={() => setAbaAtiva('revisoes')}
                                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${abaAtiva === 'revisoes'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    Revisões
                                    {revisoes.filter(r => r.status === 'pendente' || r.status === 'atrasada').length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                                            {revisoes.filter(r => r.status === 'pendente' || r.status === 'atrasada').length}
                                        </span>
                                    )}
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
                                        placeholder={abaAtiva === 'topicos' ? "Buscar tópicos ou disciplinas..." : "Buscar revisões..."}
                                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <select
                                        value={disciplinaFiltro || ''}
                                        onChange={(e) => setDisciplinaFiltro(e.target.value || null)}
                                        className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-border bg-background text-xs sm:text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    >
                                        <option value="">Todas as disciplinas</option>
                                        {disciplinas && disciplinas.map(d => (
                                            <option key={d.id} value={d.id}>{d.nome}</option>
                                        ))}
                                    </select>
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
                                {abaAtiva === 'topicos' ? (
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
                                                                className={`text-left p-2 rounded border-2 transition-all relative ${isSelected
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
                                ) : (
                                    <div className="space-y-3 sm:space-y-4">
                                        {revisoesFiltradas.map(({ disciplina, revisoes: revisoesDisciplina }) => (
                                            <div key={disciplina.id} className="border border-border rounded-lg p-2 sm:p-3">
                                                <h3 className="font-semibold mb-2 text-foreground text-sm sm:text-base">{disciplina.nome}</h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {revisoesDisciplina.map((revisao) => {
                                                        const isSelected = revisoesSelecionadas.has(revisao.id);
                                                        const topico = allTopicsMap.get(revisao.topico_id);
                                                        const isAtrasada = revisao.status === 'atrasada';
                                                        return (
                                                            <button
                                                                key={revisao.id}
                                                                onClick={() => toggleRevisaoSelecionada(revisao.id)}
                                                                className={`text-left p-2 rounded border-2 transition-all relative ${isSelected
                                                                    ? 'border-primary bg-primary/10 shadow-sm'
                                                                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                                                                    } ${isAtrasada ? 'border-orange-500/50 bg-orange-500/5' : ''}`}
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            {isAtrasada && (
                                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-500">
                                                                                    ATRASADA
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs sm:text-sm text-foreground font-medium truncate">
                                                                            {topico?.titulo || 'Tópico não encontrado'}
                                                                        </p>
                                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                            {revisao.conteudo}
                                                                        </p>
                                                                    </div>
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
                                                {revisoesDisciplina.length === 0 && (
                                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Nenhuma revisão encontrada</p>
                                                )}
                                            </div>
                                        ))}

                                        {revisoesFiltradas.length === 0 && (
                                            <div className="text-center py-6 sm:py-8 text-muted-foreground">
                                                {revisoes.length === 0 ? (
                                                    <>
                                                        <p className="text-sm sm:text-base">Nenhuma revisão disponível.</p>
                                                        <p className="text-xs sm:text-sm mt-2">Crie revisões primeiro.</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm sm:text-base">Nenhuma revisão encontrada.</p>
                                                        <p className="text-xs sm:text-sm mt-2">Tente ajustar os filtros de busca.</p>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="p-3 sm:p-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm text-muted-foreground">
                                        {(() => {
                                            const total = topicosSelecionados.size + revisoesSelecionadas.size;
                                            if (total === 0) {
                                                return 'Selecione os itens para adicionar';
                                            }
                                            const partes: string[] = [];
                                            if (topicosSelecionados.size > 0) {
                                                partes.push(`${topicosSelecionados.size} tópico${topicosSelecionados.size > 1 ? 's' : ''}`);
                                            }
                                            if (revisoesSelecionadas.size > 0) {
                                                partes.push(`${revisoesSelecionadas.size} revisão${revisoesSelecionadas.size > 1 ? 'ões' : ''}`);
                                            }
                                            return `${partes.join(' e ')} selecionado${total > 1 ? 's' : ''}`;
                                        })()}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setModalAdicionarAberto(false);
                                            setDiaParaAdicionar(null);
                                            setTopicosSelecionados(new Set());
                                            setRevisoesSelecionadas(new Set());
                                        }}
                                        className="px-3 sm:px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={adicionarTopicosAoDia}
                                        disabled={topicosSelecionados.size === 0 && revisoesSelecionadas.size === 0}
                                        className="px-3 sm:px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm flex-1 sm:flex-initial"
                                    >
                                        <PlusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span>Adicionar ({topicosSelecionados.size + revisoesSelecionadas.size})</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PremiumFeatureWrapper>
    );
};

export default TrilhaSemanal;
