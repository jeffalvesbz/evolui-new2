import React from 'react';
import { PlusIcon } from '../icons';
import { DraggableTopic, DayInfo, DayStats } from './types';
import TopicCard from './TopicCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';

interface DayColumnProps {
  dia: DayInfo;
  topics: DraggableTopic[];
  stats: DayStats;
  isDiaAtual: boolean;
  onRemove: (topicId: string, diaId: string) => void;
  onToggleConcluido: (topicId: string) => void;
  onAddTopics: (diaId: string) => void;
  activeId: string | null;
  dragOverDia: string | null;
  overId: string | null;
}

const DayColumn: React.FC<DayColumnProps> = ({
  dia,
  topics,
  stats,
  isDiaAtual,
  onRemove,
  onToggleConcluido,
  onAddTopics,
  activeId,
  dragOverDia,
  overId,
}) => {
  const normalizedStats = stats || { total: 0, progresso: 0, concluidos: 0 };
  
  // Criar zona de drop para a coluna inteira
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${dia.id}`,
  });

  // Verificar se está sendo arrastado sobre esta coluna (efeito ímã)
  const isDragOverThisColumn = dragOverDia === dia.id && activeId;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full transition-all duration-200 bg-background/20 ${
        isDragOverThisColumn
          ? 'bg-primary/15 ring-2 ring-primary/50 shadow-lg shadow-primary/20 scale-[1.01]'
          : isOver && activeId
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : ''
      }`}
    >
      {/* Header do dia */}
      <div className="flex-shrink-0 px-3 pt-3 pb-2">
        <div className="flex items-center justify-center mb-2 relative">
          <h3 className={`text-base font-extrabold ${
              isDiaAtual 
                ? 'text-primary drop-shadow-sm' 
                : 'text-foreground'
            }`}>
              {dia.nome}
            </h3>
          <button
            className={`absolute right-0 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
              isDiaAtual
                ? 'bg-primary/20 text-primary border border-primary/40'
                : 'bg-muted/40 text-muted-foreground border border-border/40'
            }`}
            title={`${normalizedStats.total} ${normalizedStats.total === 1 ? 'tópico' : 'tópicos'}`}
          >
            {normalizedStats.total}
          </button>
        </div>
        
        {/* Botão adicionar centralizado abaixo do nome */}
        <div className="flex items-center justify-center mb-2">
          <button
            onClick={() => onAddTopics(dia.id)}
            className="w-6 h-6 rounded-full border border-muted-foreground/50 hover:border-primary bg-muted/30 hover:bg-primary/10 flex items-center justify-center transition-all cursor-pointer group"
            title={`Adicionar tópicos em ${dia.nome}`}
            aria-label={`Adicionar tópicos em ${dia.nome}`}
          >
            <PlusIcon className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
        
        {/* Barra de progresso */}
        {normalizedStats.total > 0 && (
          <div className="w-full h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                normalizedStats.progresso === 100
                  ? 'bg-emerald-500'
                  : 'bg-primary'
              }`}
              style={{ width: `${normalizedStats.progresso}%` }}
            />
          </div>
        )}
      </div>

      {/* Área de tópicos */}
      <SortableContext
        items={topics.map(topico => topico.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 px-3 pb-3 overflow-hidden min-h-0">
          {topics.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <p className="text-sm text-muted-foreground">Nenhum tópico adicionado</p>
            </div>
          ) : (
            <div className="grid grid-rows-5 gap-1.5 h-full">
              {Array.from({ length: 5 }, (_, index) => {
                const topico = topics[index];
                if (!topico) {
                  return <div key={`empty-${dia.id}-${index}`} className="min-h-0" />;
                }
                const isDragOverThis = overId === topico.id && activeId && activeId !== topico.id;
                return (
                  <div key={topico.id} className="min-h-0 relative overflow-hidden">
                    {isDragOverThis && (
                      <div className="absolute inset-0 border-2 border-primary/60 rounded-xl bg-primary/10 z-10 pointer-events-none animate-pulse" />
                    )}
                    <TopicCard
                      topic={topico}
                      isDragging={activeId === topico.id}
                      isDragOver={isDragOverThis}
                      onRemove={topicId => onRemove(topicId, dia.id)}
                      onToggleConcluido={() => onToggleConcluido(topico.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default DayColumn;
