import React, { useMemo, useState, useEffect } from 'react';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEditalStore } from '../stores/useEditalStore';
import { FootprintsIcon, CheckIcon, PlayIcon, SparklesIcon, PlusIcon, XIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useModalStore } from '../stores/useModalStore';
import { toast } from './Sonner';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DIAS_SEMANA, DraggableTopic } from './TrilhaSemanal/types';
import DayColumn from './TrilhaSemanal/DayColumn';
import { DndContext, rectIntersection, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { sortTopicosPorNumero } from '../utils/sortTopicos';

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
    const [buscaModalDebounced, setBuscaModalDebounced] = useState('');
    const [disciplinaFiltro, setDisciplinaFiltro] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const [dragOverDia, setDragOverDia] = useState<string | null>(null);
    
    // Configurar sensores para drag & drop com menor distância de ativação
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    );

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

    // Helper para encontrar em qual dia está um tópico
    const findTopicDay = (topicId: string): string | null => {
        for (const dia of DIAS_SEMANA) {
            if (trilha[dia.id]?.includes(topicId)) {
                return dia.id;
            }
        }
        return null;
    };

    // Handler para quando o drag começa
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    // Handler para quando está arrastando (efeito ímã)
    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        if (over) {
            setOverId(over.id as string);
            const overIdStr = over.id as string;
            
            // Se está sobre uma zona de drop
            if (overIdStr.startsWith('droppable-')) {
                const diaId = overIdStr.replace('droppable-', '');
                setDragOverDia(diaId);
            } else {
                // Se está sobre um tópico, encontrar o dia
                const diaId = findTopicDay(overIdStr);
                if (diaId) {
                    setDragOverDia(diaId);
                }
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

        const activeId = active.id as string;
        const overId = over.id as string;

        // Encontrar o dia de origem
        const fromDia = findTopicDay(activeId);
        if (!fromDia) {
            setActiveId(null);
            return;
        }

        // Verificar se está sendo dropado em uma zona de drop (coluna vazia)
        let targetDia = fromDia;
        if (overId.startsWith('droppable-')) {
            // Extrair o ID do dia da zona de drop
            targetDia = overId.replace('droppable-', '');
        } else {
            // Encontrar o dia de destino pelo tópico
            const toDia = findTopicDay(overId);
            targetDia = toDia || fromDia;
        }

        const newTrilha = JSON.parse(JSON.stringify(trilha));
        
        // Garantir que o dia de destino existe
        if (!newTrilha[targetDia]) {
            newTrilha[targetDia] = [];
        }

        if (fromDia === targetDia) {
            // Mesmo dia: reordenar
            const column = newTrilha[fromDia];
            const oldIndex = column.indexOf(activeId);
            const newIndex = column.indexOf(overId);
            
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const novosTopicos = arrayMove(column, oldIndex, newIndex);
                newTrilha[fromDia] = novosTopicos;
            }
        } else {
            // Entre dias diferentes
            const sourceColumn = newTrilha[fromDia];
            const targetColumn = newTrilha[targetDia];
            
            const fromIndex = sourceColumn.indexOf(activeId);
            if (fromIndex === -1) {
                setActiveId(null);
                return;
            }

            // Remover duplicatas do destino antes de adicionar
            newTrilha[targetDia] = targetColumn.filter((id: string) => id !== activeId);
            
            // Encontrar posição de inserção
            let toIndex = targetColumn.indexOf(overId);
            if (toIndex === -1) {
                toIndex = targetColumn.length;
            }

            // Remover do source
            sourceColumn.splice(fromIndex, 1);
            newTrilha[fromDia] = sourceColumn;
            
            // Adicionar no destino
            newTrilha[targetDia].splice(toIndex, 0, activeId);
        }

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
        if (!diaParaAdicionar || topicosSelecionados.size === 0) return;
        
        const newTrilha = JSON.parse(JSON.stringify(trilha));
        if (!newTrilha[diaParaAdicionar]) {
            newTrilha[diaParaAdicionar] = [];
        }
        
        // Verificar tópicos já existentes na trilha (em qualquer dia da semana)
        const todosTopicosNaTrilha = new Set(
            Object.values(newTrilha).flat() as string[]
        );
        
        const adicionados: string[] = [];
        const jaExistem: string[] = [];
        
        // Remover duplicatas do dia antes de adicionar
        newTrilha[diaParaAdicionar] = newTrilha[diaParaAdicionar].filter((id: string) => !topicosSelecionados.has(id));
        
        topicosSelecionados.forEach(topicId => {
            if (todosTopicosNaTrilha.has(topicId)) {
                jaExistem.push(topicId);
            } else {
                newTrilha[diaParaAdicionar].push(topicId);
                adicionados.push(topicId);
            }
        });
        
        if (adicionados.length > 0) {
            setTrilhaCompleta(newTrilha);
            setTrilhaSemana(weekKey, newTrilha);
            
            const diaNome = DIAS_SEMANA.find(d => d.id === diaParaAdicionar)?.nome;
            let mensagem = `${adicionados.length} tópico${adicionados.length > 1 ? 's' : ''} adicionado${adicionados.length > 1 ? 's' : ''} em ${diaNome}!`;
            
            if (jaExistem.length > 0) {
                mensagem += ` ${jaExistem.length} tópico${jaExistem.length > 1 ? 's' : ''} já ${jaExistem.length > 1 ? 'estão' : 'está'} na trilha.`;
                toast.error(mensagem);
            } else {
                toast.success(mensagem);
            }
        } else if (jaExistem.length > 0) {
            toast.error(`Todos os tópicos selecionados já estão na trilha.`);
        }
        
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

    const selecionarTodosTopicos = () => {
        const todos = topicosFiltrados.flatMap(item => item.topicos.map(t => t.id));
        setTopicosSelecionados(new Set(todos));
    };

    const deselecionarTodos = () => {
        setTopicosSelecionados(new Set());
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
            <DndContext
                sensors={sensors}
                collisionDetection={rectIntersection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-hidden">
                    <div className="grid grid-cols-7 gap-3 h-[calc(100vh-160px)] px-3 sm:px-4 md:px-6 py-3">
                        {DIAS_SEMANA.map(dia => {
                            const stats = estatisticasPorDia[dia.id];
                            const isDiaAtual = isSemanaAtual && normalizarDia(dia.nome) === diaAtualNormalizado;
                            return (
                                <DayColumn
                                    key={dia.id}
                                    dia={dia}
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
                    </div>
                </div>
            </DndContext>

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
