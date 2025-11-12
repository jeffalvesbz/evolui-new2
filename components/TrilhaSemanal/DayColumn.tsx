import React from 'react';
import { PlusIcon, ClipboardListIcon } from '../icons';
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

  // Cores por dia da semana (alternando entre azul e verde)
  const getDayColor = (diaId: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      seg: { light: 'bg-blue-50/50', dark: 'dark:bg-blue-900/20' },
      ter: { light: 'bg-green-50/50', dark: 'dark:bg-green-900/20' },
      qua: { light: 'bg-blue-50/50', dark: 'dark:bg-blue-900/20' },
      qui: { light: 'bg-module-bg-light', dark: 'dark:bg-module-bg-dark' },
      sex: { light: 'bg-green-50/50', dark: 'dark:bg-green-900/20' },
      sab: { light: 'bg-blue-50/50', dark: 'dark:bg-blue-900/20' },
      dom: { light: 'bg-green-50/50', dark: 'dark:bg-green-900/20' },
    };
    return colors[diaId] || colors.seg;
  };

  const dayColors = getDayColor(dia.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 rounded-xl p-6 shadow-subtle dark:shadow-subtle-dark transition-all duration-200 ${
        dayColors.light
      } ${dayColors.dark} ${
        isDragOverThisColumn
          ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20 scale-[1.01]'
          : isOver && activeId
          ? 'ring-1 ring-primary/30'
          : ''
      }`}
    >
      <h3 className="text-lg font-bold text-text-dark dark:text-text-light">
        {dia.nome === 'Segunda' ? 'Segunda-feira' :
         dia.nome === 'Terça' ? 'Terça-feira' :
         dia.nome === 'Quarta' ? 'Quarta-feira' :
         dia.nome === 'Quinta' ? 'Quinta-feira' :
         dia.nome === 'Sexta' ? 'Sexta-feira' :
         dia.nome === 'Sábado' ? 'Sábado' :
         'Domingo'}
      </h3>

      {/* Área de tópicos */}
      <SortableContext
        items={topics.map(topico => topico.id)}
        strategy={verticalListSortingStrategy}
      >
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
            <ClipboardListIcon className="w-12 h-12 text-text-muted-light dark:text-text-muted-dark" />
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Nenhum tópico para hoje.</p>
            <button
              onClick={() => onAddTopics(dia.id)}
              className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-9 px-4 bg-vibrant-blue/10 text-vibrant-blue text-sm font-bold leading-normal hover:bg-vibrant-blue/20 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="truncate">Adicionar</span>
            </button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {topics.map((topico) => {
                const isDragOverThis = overId === topico.id && activeId && activeId !== topico.id;
                return (
                  <li
                    key={topico.id}
                    className={`group rounded-lg bg-white/50 dark:bg-black/20 p-4 shadow-sm transition-all ${
                      isDragOverThis
                        ? 'ring-2 ring-primary/60 bg-primary/10'
                        : 'hover:shadow-md dark:hover:bg-black/30'
                    }`}
                  >
                    {isDragOverThis && (
                      <div className="absolute inset-0 border-2 border-primary/60 rounded-lg bg-primary/10 z-10 pointer-events-none animate-pulse" />
                    )}
                    <TopicCard
                      topic={topico}
                      isDragging={activeId === topico.id}
                      isDragOver={isDragOverThis}
                      onRemove={topicId => onRemove(topicId, dia.id)}
                      onToggleConcluido={() => onToggleConcluido(topico.id)}
                    />
                  </li>
                );
              })}
            </ul>
            {/* Botão para adicionar mais tópicos quando já existem */}
            <button
              onClick={() => onAddTopics(dia.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border-light/50 dark:border-border-dark/50 hover:border-vibrant-blue/50 dark:hover:border-vibrant-blue/50 bg-transparent hover:bg-vibrant-blue/5 dark:hover:bg-vibrant-blue/10 py-2 px-3 transition-all group mt-2"
            >
              <PlusIcon className="w-3.5 h-3.5 text-text-muted-light dark:text-text-muted-dark group-hover:text-vibrant-blue transition-colors" />
              <span className="text-xs font-medium text-text-muted-light dark:text-text-muted-dark group-hover:text-vibrant-blue transition-colors">
                Adicionar
              </span>
            </button>
          </>
        )}
      </SortableContext>
    </div>
  );
};

export default DayColumn;
