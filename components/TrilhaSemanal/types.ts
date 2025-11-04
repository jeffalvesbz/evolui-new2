import { Topico } from '../../types';

export type DraggableTopic = Topico & { 
  disciplinaNome: string; 
  disciplinaId: string; 
};

export interface DisciplineGroupData {
  id: string;
  nome: string;
  topics: DraggableTopic[];
  color: string;
}

export const DISCIPLINE_COLORS = [
  '#10b981', // green
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#0ea5e9', // sky
  '#ec4899', // pink
  '#3b82f6', // blue
  '#ef4444', // red
];

export const getDisciplineColor = (disciplinaId: string, allDisciplinas: { id: string }[]): string => {
  const index = allDisciplinas.findIndex(d => d.id === disciplinaId);
  return DISCIPLINE_COLORS[index % DISCIPLINE_COLORS.length];
};

