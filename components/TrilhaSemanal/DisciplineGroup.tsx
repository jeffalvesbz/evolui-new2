import React from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '../icons';
import { DraggableTopic } from './types';

interface DisciplineGroupProps {
  disciplinaId: string;
  disciplinaNome: string;
  topics: DraggableTopic[];
  color: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent, topicId: string, fromDia: string, fromIndex: number) => void;
  fromDia: string;
  renderTopicCard: (topic: DraggableTopic, index: number) => React.ReactNode;
}

const DisciplineGroup: React.FC<DisciplineGroupProps> = ({
  disciplinaNome,
  topics,
  color,
  isCollapsed,
  onToggle,
  renderTopicCard,
}) => {
  const completedCount = topics.filter(t => t.concluido).length;
  const totalCount = topics.length;

  return (
    <div className="mb-3">
      {/* Header Accordion */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          {/* Ícone de Expansão */}
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            {isCollapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </div>
          
          {/* Badge Colorido */}
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          
          {/* Nome da Disciplina */}
          <span className="font-semibold text-sm text-foreground">
            {disciplinaNome}
          </span>
        </div>

        {/* Contador */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: `${color}20`,
              color: color 
            }}
          >
            {totalCount}
          </span>
        </div>
      </button>

      {/* Lista de Tópicos */}
      {!isCollapsed && (
        <div className="ml-6 mt-2 space-y-1">
          {topics.map((topic, index) => (
            <div key={topic.id}>
              {renderTopicCard(topic, index)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DisciplineGroup;




