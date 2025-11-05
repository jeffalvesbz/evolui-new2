import React, { useMemo, useState, useEffect } from 'react';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { FootprintsIcon, CheckIcon, PlayIcon, SparklesIcon, PlusIcon, XIcon, Trash2Icon, SearchIcon } from './icons';
import { Topico } from '../types';
import { useModalStore } from '../stores/useModalStore';
import { toast } from './Sonner';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card rounded-xl border border-muted/50 shadow-sm ${className}`}>
    {children}
  </div>
);

type DraggableTopic = Topico & { disciplinaNome: string; disciplinaId: string; };

const TopicCard: React.FC<{ 
    topic: DraggableTopic; 
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
    isDragging?: boolean;
    isDragOver?: boolean;
    dragOverPosition?: 'above' | 'below' | null;
    onRemove?: (topicId: string) => void;
    diaId: string;
}> = ({ topic, onDragStart, onDragEnd, isDragging = false, isDragOver = false, dragOverPosition = null, onRemove, diaId }) => {
    const { iniciarSessaoParaConclusaoRapida, iniciarSessao } = useEstudosStore();

    const handleConcluir = () => {
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

    const cardClasses = `p-3 rounded-md mb-2 transition-all duration-200 flex items-center gap-3 group relative ${
      isDragging
        ? 'opacity-40 scale-95 cursor-grabbing'
        : topic.concluido
        ? 'bg-green-500/10 border border-green-500/20 cursor-default'
        : 'bg-muted cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/50 hover:shadow-md hover:scale-[1.02]'
    }`;
  
    return (
      <>
        {isDragOver && dragOverPosition === 'above' && (
          <div className="h-0.5 bg-primary rounded-full mb-2 mx-2 animate-pulse" />
        )}
        <div
          draggable={!topic.concluido}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className={cardClasses}
          data-dragging={isDragging}
          style={{
            transform: isDragging ? 'scale(0.95)' : undefined,
          }}
        >
        {topic.concluido && (
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500 text-black">
            <CheckIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: `hsl(${(topic.disciplinaId.charCodeAt(0) * 137.5) % 360}, 70%, 60%)`
              }}
            />
            <p className="text-xs text-muted-foreground truncate">{topic.disciplinaNome}</p>
          </div>
          <p className={`text-sm font-semibold truncate ${topic.concluido ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
            {topic.titulo}
          </p>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {!topic.concluido && (
            <>
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      handleIniciarEstudo();
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Iniciar estudo"
              >
                  <PlayIcon className="w-4 h-4" />
              </button>
              <button 
                  onClick={(e) => {
                      e.stopPropagation();
                      handleConcluir();
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  title="Concluir tópico (registro rápido)"
              >
                  <CheckIcon className="w-4 h-4" />
              </button>
            </>
          )}
          {onRemove && (
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(topic.id);
                }}
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remover do dia"
            >
                <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {isDragOver && dragOverPosition === 'below' && (
        <div className="h-0.5 bg-primary rounded-full mt-2 mx-2 animate-pulse" />
      )}
      </>
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

const TrilhaSemanal: React.FC = () => {
    const { trilha, moveTopicoNaTrilha, setTrilhaCompleta } = useEstudosStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const { openGeradorPlanoModal } = useModalStore();

    const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);
    const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
    const [diaParaAdicionar, setDiaParaAdicionar] = useState<string | null>(null);
    const [topicosSelecionados, setTopicosSelecionados] = useState<Set<string>>(new Set());
    const [buscaModal, setBuscaModal] = useState('');
    const [disciplinaFiltro, setDisciplinaFiltro] = useState<string | null>(null);

    const allTopics = useMemo(() => 
        disciplinas.flatMap(d => 
            d.topicos.map(t => ({ ...t, disciplinaNome: d.nome, disciplinaId: d.id }))
        ), 
    [disciplinas]);

    const allTopicsMap = useMemo(() => new Map(allTopics.map(t => [t.id, t])), [allTopics]);

    const topicsByDay = useMemo(() => {
        const result: { [key: string]: DraggableTopic[] } = {};
        for (const dia of DIAS_SEMANA) {
            const topicos = (trilha[dia.id] || []).map(topicId => allTopicsMap.get(topicId)).filter((t): t is DraggableTopic => !!t);
            // Separar concluídos e não concluídos
            const pendentes = topicos.filter(t => !t.concluido);
            const concluidos = topicos.filter(t => t.concluido);
            result[dia.id] = [...pendentes, ...concluidos];
        }
        return result;
    }, [trilha, allTopicsMap]);

    // Estatísticas gerais
    const estatisticas = useMemo(() => {
        const todosTopicos = Object.values(topicsByDay).flat();
        const total = todosTopicos.length;
        const concluidos = todosTopicos.filter(t => t.concluido).length;
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
            const concluidos = topicos.filter(t => t.concluido).length;
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

            moveTopicoNaTrilha(topicId, fromDia, toDia, fromIndex, toIndex);
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
        
        // Criar um Set dos tópicos já existentes para evitar duplicatas
        const topicosExistentes = new Set(newTrilha[diaParaAdicionar]);
        const adicionados: string[] = [];
        
        // Adicionar apenas tópicos que ainda não existem no dia
        topicosSelecionados.forEach(topicId => {
            if (!topicosExistentes.has(topicId)) {
                newTrilha[diaParaAdicionar].push(topicId);
                adicionados.push(topicId);
            }
        });
        
        setTrilhaCompleta(newTrilha);
        
        const diaNome = DIAS_SEMANA.find(d => d.id === diaParaAdicionar)?.nome;
        if (adicionados.length > 0) {
            toast.success(`${adicionados.length} tópico${adicionados.length > 1 ? 's' : ''} adicionado${adicionados.length > 1 ? 's' : ''} em ${diaNome}!`);
        } else {
            toast.error('Todos os tópicos selecionados já estão neste dia.');
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
            toast.success(`Tópico "${topico?.titulo || 'removido'}" removido de ${DIAS_SEMANA.find(d => d.id === diaId)?.nome}`);
        }
    };

    // Tópicos já adicionados na semana
    const topicosJaAdicionados = useMemo(() => {
        return new Set(Object.values(trilha).flat());
    }, [trilha]);

    // Filtrar tópicos no modal
    const topicosFiltrados = useMemo(() => {
        return disciplinas
            .filter(d => !disciplinaFiltro || d.id === disciplinaFiltro)
            .map(disciplina => ({
                disciplina,
                topicos: disciplina.topicos.filter(topico => {
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
        <div className="flex flex-col h-full">
            <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-muted/50">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <FootprintsIcon className="w-7 h-7 text-primary" />
                            <h1 className="text-2xl font-bold text-foreground">Trilha Semanal</h1>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">Organize seus estudos arrastando os tópicos para os dias da semana.</p>
                    </div>
                    <button onClick={openGeradorPlanoModal} className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        <SparklesIcon className="w-4 h-4" />
                        Gerar Plano com IA
                    </button>
                </div>
                {/* Estatísticas gerais */}
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-semibold">{estatisticas.total} tópicos</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Concluídos:</span>
                        <span className="font-semibold text-green-500">{estatisticas.concluidos}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Pendentes:</span>
                        <span className="font-semibold text-orange-500">{estatisticas.pendentes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="font-semibold text-primary">{estatisticas.progresso}%</span>
                    </div>
                </div>
            </header>
            <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden">
                {/* Week Columns - Layout Horizontal */}
                <div className="h-full overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-4 h-full min-w-max">
                        {/* Week Columns - Horizontal */}
                        {DIAS_SEMANA.map(dia => {
                            const stats = estatisticasPorDia[dia.id];
                            const carga = stats.total === 0 ? 'vazio' : stats.total <= 3 ? 'leve' : stats.total <= 6 ? 'medio' : 'pesado';
                            return (
                            <div key={dia.id} className="flex flex-col w-64 flex-shrink-0">
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-base">{dia.nome}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            carga === 'vazio' ? 'bg-muted text-muted-foreground' :
                                            carga === 'leve' ? 'bg-green-500/20 text-green-600' :
                                            carga === 'medio' ? 'bg-yellow-500/20 text-yellow-600' :
                                            'bg-red-500/20 text-red-600'
                                        }`}>
                                            {stats.total}
                                        </span>
                                    </div>
                                    {stats.total > 0 && (
                                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-primary transition-all duration-300"
                                                style={{ width: `${stats.progresso}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <Card
                                    className={`flex-1 p-3 overflow-y-auto transition-all duration-200 h-full flex flex-col ${
                                        draggingOverDay === dia.id 
                                            ? 'bg-primary/10 border-2 border-primary shadow-lg ring-2 ring-primary/20' 
                                            : 'border-2 border-transparent'
                                    }`}
                                    onDragOver={(e) => handleDragOver(e, dia.id)}
                                    onDrop={(e) => handleDrop(e, dia.id)}
                                    onDragEnter={() => setDraggingOverDay(dia.id)}
                                    onDragLeave={handleDragLeave}
                                    style={{ minHeight: '400px' }}
                                >
                                    {isPlanoVazio && dia.id === 'seg' && (
                                        <div className="text-center p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                                            <p>Seu plano está vazio!</p>
                                            <p className="text-xs mt-1">Clique no botão + para adicionar tópicos</p>
                                        </div>
                                    )}
                                    {topicsByDay[dia.id].length === 0 && !isPlanoVazio && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <button
                                                onClick={() => abrirModalAdicionar(dia.id)}
                                                className="p-4 rounded-lg hover:bg-muted transition-all duration-200 text-muted-foreground hover:text-primary border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-2 w-full hover:scale-105"
                                                title={`Adicionar tópicos em ${dia.nome}`}
                                            >
                                                <PlusIcon className="w-6 h-6" />
                                                <span className="text-sm font-medium">Adicionar tópicos</span>
                                            </button>
                                        </div>
                                    )}
                                    {topicsByDay[dia.id].length > 0 && (
                                        <>
                                            {topicsByDay[dia.id].map((topic, index) => {
                                                const isDragOver = draggingOverDay === dia.id && dragOverIndex === index;
                                                const dragOverPosition = isDragOver ? 'above' : null;
                                                return (
                                                    <TopicCard 
                                                        key={topic.id} 
                                                        topic={topic} 
                                                        diaId={dia.id}
                                                        isDragging={draggingTopicId === topic.id}
                                                        isDragOver={isDragOver}
                                                        dragOverPosition={dragOverPosition}
                                                        onDragStart={(e) => handleDragStart(e, topic.id, dia.id, index)}
                                                        onDragEnd={handleDragEnd}
                                                        onRemove={(topicId) => removerTopicoDoDia(topicId, dia.id)}
                                                    />
                                                );
                                            })}
                                            {draggingOverDay === dia.id && dragOverIndex === topicsByDay[dia.id].length && (
                                                <div className="h-0.5 bg-primary rounded-full mt-2 mx-2 animate-pulse" />
                                            )}
                                            <div className="flex justify-center mt-2 pt-2 border-t border-border">
                                                <button
                                                    onClick={() => abrirModalAdicionar(dia.id)}
                                                    className="px-3 py-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-primary flex items-center gap-2 text-sm font-medium"
                                                    title={`Adicionar mais tópicos em ${dia.nome}`}
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                    <span>Adicionar</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </Card>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            {/* Modal para adicionar tópicos */}
            {modalAdicionarAberto && (
                <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => {
                    setModalAdicionarAberto(false);
                    setDiaParaAdicionar(null);
                    setTopicosSelecionados(new Set());
                    setBuscaModal('');
                    setDisciplinaFiltro(null);
                }}>
                    <div className="bg-card border-2 border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">Adicionar Tópicos</h2>
                                {diaParaAdicionar && (
                                    <p className="text-sm text-muted-foreground mt-1">
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
                                className="p-1 rounded hover:bg-muted transition-colors"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Filtros e busca */}
                        <div className="p-4 border-b border-border space-y-3">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={buscaModal}
                                    onChange={(e) => setBuscaModal(e.target.value)}
                                    placeholder="Buscar tópicos ou disciplinas..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setDisciplinaFiltro(null)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                        disciplinaFiltro === null
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                >
                                    Todas
                                </button>
                                {disciplinas.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDisciplinaFiltro(d.id)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                            disciplinaFiltro === d.id
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                    >
                                        {d.nome}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selecionarTodosTopicos}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Selecionar todos
                                </button>
                                <span className="text-muted-foreground">•</span>
                                <button
                                    onClick={deselecionarTodos}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Desmarcar todos
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                                {topicosFiltrados.map(({ disciplina, topicos }) => (
                                    <div key={disciplina.id} className="border border-border rounded-lg p-3">
                                        <h3 className="font-semibold mb-2 text-foreground">{disciplina.nome}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {topicos.map(topico => {
                                                const isSelected = topicosSelecionados.has(topico.id);
                                                const jaAdicionado = topicosJaAdicionados.has(topico.id);
                                                return (
                                                    <button
                                                        key={topico.id}
                                                        onClick={() => toggleTopicoSelecionado(topico.id)}
                                                        disabled={jaAdicionado}
                                                        className={`text-left p-2 rounded border-2 transition-all relative ${
                                                            jaAdicionado
                                                                ? 'opacity-50 cursor-not-allowed border-border bg-muted/50'
                                                                : isSelected 
                                                                ? 'border-primary bg-primary/10 shadow-sm' 
                                                                : 'border-border hover:border-primary/50 hover:bg-primary/5'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-foreground truncate flex-1">{topico.titulo}</span>
                                                            {isSelected && (
                                                                <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 ml-2" />
                                                            )}
                                                            {jaAdicionado && (
                                                                <span className="text-xs text-muted-foreground ml-2">✓ já adicionado</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {topicos.length === 0 && (
                                            <p className="text-xs text-muted-foreground">Nenhum tópico encontrado</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {topicosFiltrados.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Nenhum tópico encontrado.</p>
                                    <p className="text-sm mt-2">Tente ajustar os filtros de busca.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
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
                                    className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={adicionarTopicosAoDia}
                                    disabled={topicosSelecionados.size === 0}
                                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    Adicionar ({topicosSelecionados.size})
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