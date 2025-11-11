import React, { useMemo, useState } from 'react';
import { SearchIcon } from '../icons';
import { DraggableTopic, getDisciplineColor } from './types';
import DisciplineGroup from './DisciplineGroup';
import { sortTopicosPorNumero } from '../../utils/sortTopicos';

interface BacklogPanelProps {
  topics: DraggableTopic[];
  allDisciplinas: { id: string; nome: string }[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isDraggingOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  renderTopicCard: (topic: DraggableTopic, index: number, fromDia: string) => React.ReactNode;
}

const BacklogPanel: React.FC<BacklogPanelProps> = ({
  topics,
  allDisciplinas,
  searchTerm,
  onSearchChange,
  isDraggingOver,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
  renderTopicCard,
}) => {
  // Estado de collapse por disciplina
  const [collapsedDisciplines, setCollapsedDisciplines] = useState<Set<string>>(new Set());

  const toggleDiscipline = (disciplinaId: string) => {
    setCollapsedDisciplines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(disciplinaId)) {
        newSet.delete(disciplinaId);
      } else {
        newSet.add(disciplinaId);
      }
      return newSet;
    });
  };

  // Agrupar tópicos por disciplina
  const topicsByDiscipline = useMemo(() => {
    const groups = new Map<string, DraggableTopic[]>();
    
    topics.forEach(topic => {
      const existing = groups.get(topic.disciplinaId) || [];
      groups.set(topic.disciplinaId, [...existing, topic]);
    });

    return Array.from(groups.entries())
      .map(([disciplinaId, disciplineTopics]) => {
        const disciplina = allDisciplinas.find(d => d.id === disciplinaId);
        return {
          disciplinaId,
          disciplinaNome: disciplina?.nome || disciplineTopics[0]?.disciplinaNome || 'Sem disciplina',
          topics: sortTopicosPorNumero(disciplineTopics),
          color: getDisciplineColor(disciplinaId, allDisciplinas),
        };
      })
      .sort((a, b) => a.disciplinaNome.localeCompare(b.disciplinaNome));
  }, [topics, allDisciplinas]);

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-muted/50 shadow-sm overflow-hidden">
      {/* Header Sticky com Busca */}
      <div className="flex-shrink-0 p-4 border-b border-border bg-card/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Backlog</h2>
          <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
            {topics.length}
          </span>
        </div>
        
        {/* Campo de Busca */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar tópicos ou disciplinas..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-3 text-sm text-foreground
              focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none
              transition-all duration-200"
          />
        </div>
      </div>

      {/* Área de Drop com Grupos de Disciplinas */}
      <div
        className={`
          flex-1 p-4 overflow-y-auto transition-all duration-300
          ${isDraggingOver ? 'bg-primary/10' : ''}
        `}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        {topics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {searchTerm ? 'Nenhum tópico encontrado' : 'Todos os tópicos foram agendados!'}
            </p>
          </div>
        ) : (
          topicsByDiscipline.map(group => (
            <DisciplineGroup
              key={group.disciplinaId}
              disciplinaId={group.disciplinaId}
              disciplinaNome={group.disciplinaNome}
              topics={group.topics}
              color={group.color}
              isCollapsed={collapsedDisciplines.has(group.disciplinaId)}
              onToggle={() => toggleDiscipline(group.disciplinaId)}
              onDragStart={() => {}} // não usado aqui
              fromDia="backlog"
              renderTopicCard={(topic) => {
                const index = topics.findIndex(t => t.id === topic.id);
                return renderTopicCard(topic, index, 'backlog');
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BacklogPanel;

