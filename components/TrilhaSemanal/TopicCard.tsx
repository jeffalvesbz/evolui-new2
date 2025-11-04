import React from 'react';
import { CheckIcon, PlayIcon } from '../icons';
import { DraggableTopic } from './types';

interface TopicCardProps {
  topic: DraggableTopic;
  color: string;
  onDragStart: (e: React.DragEvent) => void;
  onIniciarEstudo: () => void;
  onConcluir: () => void;
  showDisciplineName?: boolean;
  isDragging?: boolean;
}

const TopicCard: React.FC<TopicCardProps> = ({ 
  topic, 
  color,
  onDragStart, 
  onIniciarEstudo,
  onConcluir,
  showDisciplineName = false,
  isDragging = false
}) => {
  const cardClasses = `
    relative p-4 rounded-lg mb-2 transition-all duration-300 
    flex items-center gap-3 group
    ${isDragging ? 'opacity-50 scale-95' : ''}
    ${topic.concluido
      ? 'bg-green-500/10 border border-green-500/20 cursor-default'
      : 'bg-muted cursor-grab active:cursor-grabbing border border-transparent hover:border-primary/50 hover:shadow-md hover:scale-[1.02]'
    }
  `;

  return (
    <div
      draggable={!topic.concluido}
      onDragStart={onDragStart}
      className={cardClasses}
      style={{
        borderLeft: topic.concluido ? undefined : `4px solid ${color}`,
      }}
    >
      {topic.concluido && (
        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full bg-green-500 text-black">
          <CheckIcon className="w-3.5 h-3.5" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${topic.concluido ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
          {topic.titulo}
        </p>
        {showDisciplineName && (
          <p className="text-xs text-muted-foreground mt-0.5">{topic.disciplinaNome}</p>
        )}
      </div>
      
      {!topic.concluido && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onIniciarEstudo();
            }}
            className="p-2 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
            title="Iniciar estudo"
          >
            <PlayIcon className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onConcluir();
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

export default TopicCard;

