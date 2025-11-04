import React, { useMemo } from 'react';
import { DraggableTopic } from './types';
import EmptyState from './EmptyState';

interface DayColumnProps {
  day: { id: string; nome: string };
  topics: DraggableTopic[];
  isDraggingOver: boolean;
  isPlanoVazio: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  renderTopicCard: (topic: DraggableTopic, index: number) => React.ReactNode;
}

const DayColumn: React.FC<DayColumnProps> = ({
  day,
  topics,
  isDraggingOver,
  isPlanoVazio,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  renderTopicCard,
}) => {
  // Agrupar tópicos por disciplina (apenas se houver mais de 5 tópicos)
  const shouldGroupByDiscipline = topics.length > 5;
  
  const topicsByDiscipline = useMemo(() => {
    if (!shouldGroupByDiscipline) return null;
    
    const groups = new Map<string, DraggableTopic[]>();
    topics.forEach(topic => {
      const existing = groups.get(topic.disciplinaId) || [];
      groups.set(topic.disciplinaId, [...existing, topic]);
    });
    
    return Array.from(groups.entries()).map(([disciplinaId, disciplineTopics]) => ({
      disciplinaId,
      disciplinaNome: disciplineTopics[0]?.disciplinaNome || '',
      topics: disciplineTopics,
    }));
  }, [topics, shouldGroupByDiscipline]);

  const completedCount = topics.filter(t => t.concluido).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header Fixo */}
      <div className="flex-shrink-0 mb-4">
        <h3 className="font-bold text-center text-foreground">
          {day.nome}
        </h3>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{topics.length}
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {topics.length}
          </span>
        </div>
      </div>

      {/* Área de Drop */}
      <div
        className={`
          flex-1 p-3 rounded-xl border border-muted/50 bg-card shadow-sm
          overflow-y-auto transition-all duration-300
          ${isDraggingOver ? 'border-primary border-2 bg-primary/10 shadow-lg' : ''}
        `}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        {/* Empty State - apenas na segunda-feira se o plano está vazio */}
        {isPlanoVazio && day.id === 'seg' && (
          <EmptyState />
        )}

        {/* Renderizar tópicos (simples ou agrupados) */}
        {!shouldGroupByDiscipline ? (
          // Renderização simples
          topics.map((topic, index) => (
            <div key={topic.id}>
              {renderTopicCard(topic, index)}
            </div>
          ))
        ) : (
          // Renderização agrupada por disciplina
          topicsByDiscipline?.map(group => (
            <div key={group.disciplinaId} className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                {group.disciplinaNome}
              </h4>
              <div className="space-y-1">
                {group.topics.map((topic, index) => {
                  const globalIndex = topics.findIndex(t => t.id === topic.id);
                  return (
                    <div key={topic.id}>
                      {renderTopicCard(topic, globalIndex)}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DayColumn;

