import React, { useMemo, useState } from 'react';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { FootprintsIcon, SparklesIcon } from './icons';
import { useModalStore } from '../stores/useModalStore';
import { DraggableTopic, getDisciplineColor } from './TrilhaSemanal/types';
import TopicCard from './TrilhaSemanal/TopicCard';
import BacklogPanel from './TrilhaSemanal/BacklogPanel';
import DayColumn from './TrilhaSemanal/DayColumn';

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
    const { trilha, moveTopicoNaTrilha, iniciarSessaoParaConclusaoRapida, iniciarSessao } = useEstudosStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const { openGeradorPlanoModal } = useModalStore();

    const [draggingOverDay, setDraggingOverDay] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [draggingTopicId, setDraggingTopicId] = useState<string | null>(null);

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
        setDraggingTopicId(topicId);
    };

    const handleDragEnd = () => {
        setDraggingTopicId(null);
        setDraggingOverDay(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, toDia: string) => {
        e.preventDefault();
        setDraggingOverDay(null);
        setDraggingTopicId(null);
        
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
    
    const isPlanoVazio = Object.values(topicsByDay).every((day: DraggableTopic[]) => day.length === 0) && unscheduledTopics.length > 0;

    // Função para renderizar TopicCard com handlers
    const renderTopicCard = (topic: DraggableTopic, index: number, fromDia: string) => {
        const color = getDisciplineColor(topic.disciplinaId, disciplinas);
        
        return (
            <div onDragEnd={handleDragEnd}>
                <TopicCard
                    key={topic.id}
                    topic={topic}
                    color={color}
                    isDragging={draggingTopicId === topic.id}
                    onDragStart={(e) => {
                        handleDragStart(e, topic.id, fromDia, index);
                    }}
                    onIniciarEstudo={() => {
                        iniciarSessao({
                            id: topic.id,
                            nome: topic.titulo,
                            disciplinaId: topic.disciplinaId
                        });
                    }}
                    onConcluir={() => {
                        iniciarSessaoParaConclusaoRapida({
                            id: topic.id,
                            nome: topic.titulo,
                            disciplinaId: topic.disciplinaId,
                        });
                    }}
                    showDisciplineName={false}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-muted/50 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <FootprintsIcon className="w-7 h-7 text-primary" />
                        <h1 className="text-2xl font-bold text-foreground">Trilha Semanal</h1>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Organize seus estudos arrastando os tópicos para os dias da semana.
                    </p>
                </div>
                <button 
                    onClick={openGeradorPlanoModal} 
                    className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <SparklesIcon className="w-4 h-4" />
                    Gerar Plano com IA
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-6 overflow-hidden">
                {/* Backlog Panel */}
                <div className="flex flex-col h-full min-h-0">
                    <BacklogPanel
                        topics={unscheduledTopics}
                        allDisciplinas={disciplinas}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        isDraggingOver={draggingOverDay === 'backlog'}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'backlog')}
                        onDragEnter={() => setDraggingOverDay('backlog')}
                        onDragLeave={() => setDraggingOverDay(null)}
                        renderTopicCard={renderTopicCard}
                    />
                </div>

                {/* Week Columns */}
                <div className="overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 min-w-0 lg:min-w-[56rem] snap-x snap-mandatory">
                        {DIAS_SEMANA.map(dia => (
                            <div key={dia.id} className="snap-start min-w-[280px] md:min-w-0">
                                <DayColumn
                                    day={dia}
                                    topics={topicsByDay[dia.id]}
                                    isDraggingOver={draggingOverDay === dia.id}
                                    isPlanoVazio={isPlanoVazio}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, dia.id)}
                                    onDragEnter={() => setDraggingOverDay(dia.id)}
                                    onDragLeave={() => setDraggingOverDay(null)}
                                    renderTopicCard={(topic, index) => renderTopicCard(topic, index, dia.id)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrilhaSemanal;
