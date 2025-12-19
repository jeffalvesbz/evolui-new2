import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, PlayIcon, XIcon, LandmarkIcon, PencilRulerIcon, ClipboardListIcon, RepeatIcon, BookOpenIcon, ClockIcon } from '../icons';
import { useEstudosStore } from '../../stores/useEstudosStore';
import { useUiStore } from '../../stores/useUiStore';
import { DraggableTopic } from './types';
import { SortableItem } from './SortableItem';
import { motion, useAnimation } from 'framer-motion';

interface TopicCardProps {
  topic: DraggableTopic;
  isDragging?: boolean;
  isDragOver?: boolean;
  onRemove?: (instanceId: string) => void;
  onToggleConcluido: () => void;
}

const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  isDragging = false,
  isDragOver = false,
  onRemove,
  onToggleConcluido,
}) => {
  const { iniciarSessao, iniciarSessaoParaConclusaoRapida } = useEstudosStore();
  const { isSaveModalOpen } = useUiStore();
  const controls = useAnimation();
  const previouslyDragging = useRef(false);
  const descricaoCompleta = useMemo(() => {
    const descricao =
      (topic as any)?.descricao ||
      (topic as any)?.detalhes ||
      (topic as any)?.conteudo ||
      (topic as any)?.resumo;
    return typeof descricao === 'string' && descricao.trim() ? descricao.trim() : null;
  }, [topic]);

  const temDescricao = descricaoCompleta !== null && descricaoCompleta !== topic.titulo;
  const concluidoNaTrilha = !!topic.concluidoNaTrilha;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previouslyDragging.current && !isDragging) {
      controls.start({
        scale: [1.05, 0.98, 1],
        transition: { duration: 0.3, ease: 'easeOut' },
      });
    }
    previouslyDragging.current = isDragging;
  }, [isDragging, controls]);

  const handleConcluir = () => {
    onToggleConcluido();
    iniciarSessaoParaConclusaoRapida({
      id: topic.id,
      nome: topic.titulo,
      disciplinaId: topic.disciplinaId,
    }, {
      origemTrilha: true,
    });
  };

  const handleIniciarEstudo = () => {
    iniciarSessao({
      id: topic.id,
      nome: topic.titulo,
      disciplinaId: topic.disciplinaId,
    }, 'cronometro', {
      origemTrilha: true,
    });
  };

  // Visual distinction based on Activity Type
  // Uses CSS variables that automatically adapt based on .light class in index.css
  const activityStyles = useMemo(() => {
    const type = topic.type || 'teoria';
    const isCompleted = concluidoNaTrilha;

    // All cards use bg-card (white in light mode, dark in dark mode)
    // Border colors differentiate activity types
    switch (type) {
      case 'lei_seca':
        return {
          borderColor: isCompleted ? 'border-muted' : 'border-green-500',
          bgColor: 'bg-card',
          icon: <LandmarkIcon className={`w-4 h-4 ${isCompleted ? 'text-muted-foreground' : 'text-green-500'}`} />,
          labelColor: isCompleted ? 'text-muted-foreground' : 'text-foreground'
        };
      case 'questao':
        return {
          borderColor: isCompleted ? 'border-muted' : 'border-blue-500',
          bgColor: 'bg-card',
          icon: <ClipboardListIcon className={`w-4 h-4 ${isCompleted ? 'text-muted-foreground' : 'text-blue-500'}`} />,
          labelColor: isCompleted ? 'text-muted-foreground' : 'text-foreground'
        };
      case 'redacao':
        return {
          borderColor: isCompleted ? 'border-muted' : 'border-pink-500',
          bgColor: 'bg-card',
          icon: <PencilRulerIcon className={`w-4 h-4 ${isCompleted ? 'text-muted-foreground' : 'text-pink-500'}`} />,
          labelColor: isCompleted ? 'text-muted-foreground' : 'text-foreground'
        };
      case 'revisao':
        return {
          borderColor: isCompleted ? 'border-muted' : 'border-orange-500',
          bgColor: 'bg-card',
          icon: <RepeatIcon className={`w-4 h-4 ${isCompleted ? 'text-muted-foreground' : 'text-orange-500'}`} />,
          labelColor: isCompleted ? 'text-muted-foreground' : 'text-foreground'
        };
      default: // teoria
        return {
          borderColor: isCompleted ? 'border-muted' : 'border-purple-500',
          bgColor: 'bg-card',
          icon: <BookOpenIcon className={`w-4 h-4 ${isCompleted ? 'text-muted-foreground' : 'text-purple-500'}`} />,
          labelColor: isCompleted ? 'text-muted-foreground' : 'text-foreground'
        };
    }
  }, [topic.type, concluidoNaTrilha]);

  return (
    <>
      <SortableItem id={topic.instanceId} disabled={concluidoNaTrilha}>
        <motion.div
          animate={controls}
          whileHover={{ scale: concluidoNaTrilha ? 1 : 1.01 }}
          className="h-full w-full"
        >
          <div
            ref={cardRef}
            className={`group relative flex flex-col transition-all duration-200 border-l-4 rounded-lg p-3 shadow-sm hover:shadow-md
                ${isDragging ? 'opacity-40 scale-95' : ''} 
                ${isDragOver ? 'ring-2 ring-primary/60 bg-primary/10' : ''}
                ${activityStyles.borderColor} ${activityStyles.bgColor}
            `}
          >
            {/* Checkbox e título */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleConcluido();
                  }}
                  className="flex-shrink-0"
                  aria-label={concluidoNaTrilha ? "Desmarcar como concluído" : "Marcar como concluído"}
                >
                  {concluidoNaTrilha ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success hover:bg-success/80 transition-colors cursor-pointer">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border hover:border-success transition-colors cursor-pointer" />
                  )}
                </button>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`text-sm font-medium ${activityStyles.labelColor} ${concluidoNaTrilha ? 'line-through opacity-75' : ''}`}>
                    {topic.titulo}
                  </span>
                  {topic.duracaoEstimada && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <ClockIcon className="w-3 h-3" />
                      <span>{topic.duracaoEstimada} min</span>
                      {/* Mostra o tipo explícito se não for teoria */}
                      {topic.type && topic.type !== 'teoria' && (
                        <span className="capitalize ml-1">• {topic.type.replace('_', ' ')}</span>
                      )}
                    </div>
                  )}
                </div>
                {/* Ícone do tipo de atividade no canto superior direito */}
                {topic.type && topic.type !== 'teoria' && !concluidoNaTrilha && (
                  <div className="opacity-70" title={topic.type}>
                    {activityStyles.icon}
                  </div>
                )}
              </div>
              {onRemove && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRemove(topic.instanceId);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100 flex-shrink-0"
                  aria-label="Remover tópico"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Botões de ação */}
            {concluidoNaTrilha ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onToggleConcluido();
                  }}
                  className="flex h-8 items-center justify-center gap-2 rounded-full bg-muted/10 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/20"
                  aria-label="Desmarcar como concluído"
                >
                  <XIcon className="h-4 w-4" />
                  <span>Desmarcar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleIniciarEstudo();
                  }}
                  className="flex h-8 items-center justify-center gap-2 rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  aria-label="Iniciar estudo"
                >
                  <PlayIcon className="h-4 w-4" />
                  <span>Iniciar</span>
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleConcluir();
                  }}
                  className="flex h-8 items-center justify-center gap-2 rounded-full bg-success/10 px-3 text-sm font-semibold text-success transition-colors hover:bg-success/20"
                  aria-label="Concluir"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>Concluir</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </SortableItem>
    </>
  );
};

export default TopicCard;
