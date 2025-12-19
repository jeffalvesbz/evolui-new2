import React from 'react';
import { PlusIcon, ClipboardListIcon, CheckIcon } from '../icons';
import { DraggableTopic, DayInfo, DayStats } from './types';
import TopicCard from './TopicCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DayColumnProps {
  dia: DayInfo;
  topics: DraggableTopic[];
  stats: DayStats;
  isDiaAtual: boolean;
  onRemove: (instanceId: string) => void;
  onToggleConcluido: (topicId: string) => void;
  onAddTopics: (diaId: string) => void;
  activeId: string | null;
  dragOverDia: string | null;
  overId: string | null;
  date: Date;
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
  date,
}) => {
  const normalizedStats = stats || { total: 0, progresso: 0, concluidos: 0 };

  // Criar zona de drop para a coluna inteira
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${dia.id}`,
  });

  // Verificar se está sendo arrastado sobre esta coluna (efeito ímã)
  const isDragOverThisColumn = dragOverDia === dia.id && activeId;

  // Cores azuis para todos os dias
  const getDayColor = (diaId: string) => {
    const colors: Record<string, { light: string; dark: string }> = {
      seg: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
      ter: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
      qua: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
      qui: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
      sex: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
      sab: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
      dom: { light: 'bg-slate-50', dark: 'dark:bg-blue-900/20' },
    };
    return colors[diaId] || colors.seg;
  };

  const dayColors = getDayColor(dia.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 rounded-xl p-6 shadow-subtle dark:shadow-subtle-dark transition-all duration-200 ${dayColors.light
        } ${dayColors.dark} ${isDiaAtual
          ? 'ring-2 ring-primary border-2 border-primary/60 bg-primary/10 dark:bg-primary/20 shadow-lg shadow-primary/30'
          : ''
        } ${isDragOverThisColumn
          ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20 scale-[1.01]'
          : isOver && activeId
            ? 'ring-1 ring-primary/30'
            : ''
        }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className={`text-lg font-bold ${isDiaAtual
            ? 'text-primary'
            : 'text-foreground'
            }`}>
            {dia.nome === 'Segunda' ? 'Segunda-feira' :
              dia.nome === 'Terça' ? 'Terça-feira' :
                dia.nome === 'Quarta' ? 'Quarta-feira' :
                  dia.nome === 'Quinta' ? 'Quinta-feira' :
                    dia.nome === 'Sexta' ? 'Sexta-feira' :
                      dia.nome === 'Sábado' ? 'Sábado' :
                        'Domingo'}
          </h3>
          {isDiaAtual && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">Hoje</span>
          )}
          {normalizedStats.progresso === 100 && normalizedStats.total > 0 && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white" title="Dia concluído!">
              <CheckIcon className="w-3 h-3" />
            </div>
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground/80">
          {format(date, "d 'de' MMM", { locale: ptBR })}
        </span>
      </div>

      {stats.total > 0 && (
        <div className="w-full h-1.5 bg-border/50 dark:bg-white/5 rounded-full mb-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${normalizedStats.progresso === 100 ? 'bg-green-500' : 'bg-primary'
              }`}
            style={{ width: `${normalizedStats.progresso}%` }}
          />
        </div>
      )}

      {/* Área de tópicos */}
      <SortableContext
        items={topics.map(topico => topico.instanceId)}
        strategy={verticalListSortingStrategy}
      >
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
            <ClipboardListIcon className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground max-w-[150px]">Planeje seus estudos para este dia.</p>
            <button
              onClick={() => onAddTopics(dia.id)}
              className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-9 px-4 bg-primary text-primary-foreground text-sm font-bold leading-normal hover:bg-primary/90 transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="truncate">Planejar</span>
            </button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {topics.map((topico) => {
                const isDragOverThis = overId === topico.instanceId && activeId && activeId !== topico.instanceId;
                return (
                  <li
                    key={topico.instanceId}
                    className={`group rounded-lg bg-white/50 dark:bg-black/20 p-4 shadow-sm transition-all ${isDragOverThis
                      ? 'ring-2 ring-primary/60 bg-primary/10'
                      : 'hover:shadow-md dark:hover:bg-black/30'
                      }`}
                  >
                    {isDragOverThis && (
                      <div className="absolute inset-0 border-2 border-primary/60 rounded-lg bg-primary/10 z-10 pointer-events-none animate-pulse" />
                    )}
                    <TopicCard
                      topic={topico}
                      isDragging={activeId === topico.instanceId}
                      isDragOver={isDragOverThis}
                      onRemove={() => onRemove(topico.instanceId)}
                      onToggleConcluido={() => onToggleConcluido(topico.id)}
                    />
                  </li>
                );
              })}
            </ul>
            {/* Botão para adicionar mais tópicos quando já existem */}
            <button
              onClick={() => onAddTopics(dia.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border/50 hover:border-border bg-transparent hover:bg-muted/30 py-2 px-3 transition-all group mt-2"
            >
              <PlusIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
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
