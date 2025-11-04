import React, { useMemo, useState } from 'react';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { FootprintsIcon, CheckIcon, PlayIcon, SparklesIcon, SearchIcon } from './icons';
import { Topico } from '../types';
import { useModalStore } from '../stores/useModalStore';

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
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                    e.stopPropagation(); // Prevent drag from starting
                    handleConcluir();
                }}
                className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                title="Concluir tópico (registro rápido)"
            >
                <CheckIcon className="w-4 h-4" />
            </button>
          </div>
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
    const { openGeradorPlanoModal } = useModalStore();

    const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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

            if (searchTerm.trim() === '') {
                return true;
            }
            return t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   t.disciplinaNome.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [allTopics, scheduledTopicIds, searchTerm]);

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
    
    // FIX: Explicitly type `day` to resolve `unknown` type error from Object.values inference.
    const isPlanoVazio = Object.values(topicsByDay).every((day: DraggableTopic[]) => day.length === 0) && unscheduledTopics.length > 0;

    return (
        <div className="flex flex-col h-full">
            <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-muted/50 flex items-center justify-between">
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
            </header>
            <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-6 overflow-hidden">
                {/* Backlog Column */}
                <div className="flex flex-col">
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-3 border-b border-border flex justify-between items-center flex-shrink-0">
                            <h2 className="text-xl font-bold">Backlog de Tópicos ({unscheduledTopics.length})</h2>
                            <div className="relative">
                                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-40 rounded-md border border-border bg-background py-1.5 pl-8 pr-2 text-sm focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div
                            className={`flex-1 p-3 overflow-y-auto transition-colors ${draggingOverDay === 'backlog' ? 'bg-primary/10' : ''}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, 'backlog')}
                            onDragEnter={() => setDraggingOverDay('backlog')}
                            onDragLeave={() => setDraggingOverDay(null)}
                        >
                            {unscheduledTopics.map((topic, index) => (
                                <TopicCard key={topic.id} topic={topic} onDragStart={(e) => handleDragStart(e, topic.id, 'backlog', index)} />
                            ))}
                        </div>
                    </Card>
                </div>


                {/* Week Columns */}
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 gap-4 min-w-[56rem]">
                        {DIAS_SEMANA.map(dia => (
                            <div key={dia.id} className="flex flex-col">
                                <h3 className="font-bold text-center mb-4">{dia.nome} ({topicsByDay[dia.id].length})</h3>
                                <Card
                                    className={`flex-1 p-3 overflow-y-auto transition-colors ${draggingOverDay === dia.id ? 'bg-primary/10' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, dia.id)}
                                    onDragEnter={() => setDraggingOverDay(dia.id)}
                                    onDragLeave={() => setDraggingOverDay(null)}
                                >
                                    {isPlanoVazio && dia.id === 'seg' && (
                                        <div className="text-center p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground text-sm">
                                            <p>Seu plano está vazio!</p>
                                            <p>Arraste os tópicos do backlog para cá para começar.</p>
                                        </div>
                                    )}
                                    {topicsByDay[dia.id].map((topic, index) => (
                                        <TopicCard key={topic.id} topic={topic} onDragStart={(e) => handleDragStart(e, topic.id, dia.id, index)} />
                                    ))}
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrilhaSemanal;