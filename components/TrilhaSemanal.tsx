import React, { useMemo, useState } from 'react';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { FootprintsIcon, CheckIcon } from './icons';
import { Topico } from '../types';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card rounded-xl border border-muted/50 shadow-sm ${className}`}>
    {children}
  </div>
);

type DraggableTopic = Topico & { disciplinaNome: string; disciplinaId: string; };

const TopicCard: React.FC<{ 
    topic: DraggableTopic; 
    onDragStart: (e: React.DragEvent) => void 
}> = ({ topic, onDragStart }) => {
    const { iniciarSessaoParaConclusaoRapida } = useEstudosStore();

    const handleConcluir = () => {
        iniciarSessaoParaConclusaoRapida({
            id: topic.id,
            nome: topic.titulo,
            disciplinaId: topic.disciplinaId,
        });
    };

    const cardClasses = `p-3 rounded-md mb-2 transition-all duration-300 flex items-center gap-3 group relative ${
      topic.concluido
        ? 'bg-green-500/10 border border-green-500/20 cursor-default'
        : 'bg-muted cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/50'
    }`;
  
    return (
      <div
        draggable={!topic.concluido}
        onDragStart={onDragStart}
        className={cardClasses}
      >
        {topic.concluido && (
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500 text-black">
            <CheckIcon className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="flex-1">
          <p className={`text-sm font-semibold ${topic.concluido ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
            {topic.titulo}
          </p>
          <p className="text-xs text-muted-foreground">{topic.disciplinaNome}</p>
        </div>
        {!topic.concluido && (
          <button 
            onClick={(e) => {
                e.stopPropagation(); // Prevent drag from starting
                handleConcluir();
            }}
            className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            title="Concluir tópico"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
        )}
      </div>
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
    const { trilha, moveTopicoNaTrilha } = useEstudosStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);
    const [filtroDisciplina, setFiltroDisciplina] = useState<string>('todas');

    const allTopics = useMemo(() => 
        disciplinas.flatMap(d => 
            d.topicos.map(t => ({ ...t, disciplinaNome: d.nome, disciplinaId: d.id }))
        ), 
    [disciplinas]);

    const allTopicsMap = useMemo(() => new Map(allTopics.map(t => [t.id, t])), [allTopics]);

    const scheduledTopicIds = useMemo(() => new Set(Object.values(trilha).flat()), [trilha]);
    
    const unscheduledTopics = useMemo(() => {
        return allTopics.filter(t => {
            const isUnscheduled = !scheduledTopicIds.has(t.id);
            if (!isUnscheduled) return false;

            if (filtroDisciplina === 'todas') {
                return true;
            }
            return t.disciplinaId === filtroDisciplina;
        });
    }, [allTopics, scheduledTopicIds, filtroDisciplina]);

    const topicsByDay = useMemo(() => {
        const result: { [key: string]: DraggableTopic[] } = {};
        for (const dia of DIAS_SEMANA) {
            result[dia.id] = (trilha[dia.id] || []).map(topicId => allTopicsMap.get(topicId)).filter((t): t is DraggableTopic => !!t);
        }
        return result;
    }, [trilha, allTopicsMap]);

    const handleDragStart = (e: React.DragEvent, topicId: string, fromDia: string, fromIndex: number) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ topicId, fromDia, fromIndex }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, toDia: string) => {
        e.preventDefault();
        setDraggingOverDay(null);
        try {
            const draggedData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (!draggedData) return;

            const { topicId, fromDia, fromIndex } = draggedData;

            const dropZone = e.currentTarget as HTMLElement;
            const cards = Array.from(dropZone.querySelectorAll('[draggable="true"]'));
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
    
    return (
        <div className="flex flex-col h-full">
            <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-muted/50">
                <div className="flex items-center gap-3">
                    <FootprintsIcon className="w-7 h-7 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">Trilha Semanal</h1>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">Organize seus estudos arrastando os tópicos para os dias da semana.</p>
            </header>
            <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                {/* Unscheduled Topics */}
                <div className="lg:col-span-1 flex flex-col h-full overflow-y-hidden">
                    <Card className="flex-1 flex flex-col h-full overflow-y-hidden p-4">
                        <div className="sticky top-0 bg-card z-10 pb-4">
                            <h2 className="text-lg font-semibold text-card-foreground mb-2">Tópicos não agendados</h2>
                            <select
                                id="disciplina-filter"
                                value={filtroDisciplina}
                                onChange={(e) => setFiltroDisciplina(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                                aria-label="Filtrar por disciplina"
                            >
                                <option value="todas">Todas as Disciplinas</option>
                                {disciplinas.map(d => (
                                    <option key={d.id} value={d.id}>{d.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="overflow-y-auto flex-1 -mr-4 pr-4">
                            {unscheduledTopics.length > 0 ? (
                                unscheduledTopics.map((topic) => (
                                    <TopicCard key={topic.id} topic={topic} onDragStart={(e) => handleDragStart(e, topic.id, 'backlog', -1)} />
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <p>Nenhum tópico encontrado.</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Weekly Grid */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-4 h-full overflow-y-auto">
                    {DIAS_SEMANA.map(dia => (
                        <div
                            key={dia.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dia.id)}
                            onDragEnter={() => setDraggingOverDay(dia.id)}
                            onDragLeave={() => setDraggingOverDay(null)}
                            className={`p-2 rounded-lg transition-colors h-full flex flex-col ${draggingOverDay === dia.id ? 'bg-primary/10' : 'bg-muted/50'}`}
                        >
                            <h3 className="font-bold text-center text-primary mb-3 p-2">{dia.nome}</h3>
                            <div className="flex-1 space-y-2 min-h-[100px]">
                                {topicsByDay[dia.id].map((topic, index) => (
                                    <TopicCard key={topic.id} topic={topic} onDragStart={(e) => handleDragStart(e, topic.id, dia.id, index)} />
                                ))}
                                {topicsByDay[dia.id].length === 0 && (
                                    <div className="text-center text-xs text-muted-foreground pt-8">
                                        Arraste um tópico aqui
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrilhaSemanal;