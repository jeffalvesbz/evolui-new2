import { Topico } from '../../types';

export type DraggableTopic = Topico & { 
  disciplinaNome: string; 
  disciplinaId: string;
  concluidoNaTrilha?: boolean;
};

export interface TopicPreviewState {
  topic: DraggableTopic;
  diaNome: string;
}

export interface DayStats {
  total: number;
  concluidos: number;
  progresso: number;
}

export interface WeekStats {
  total: number;
  concluidos: number;
  pendentes: number;
  progresso: number;
}

export interface DayInfo {
  id: string;
  nome: string;
}

export const DIAS_SEMANA: DayInfo[] = [
  { id: 'seg', nome: 'Segunda' },
  { id: 'ter', nome: 'Terça' },
  { id: 'qua', nome: 'Quarta' },
  { id: 'qui', nome: 'Quinta' },
  { id: 'sex', nome: 'Sexta' },
  { id: 'sab', nome: 'Sábado' },
  { id: 'dom', nome: 'Domingo' },
];

export const getDisciplineColor = (disciplinaId: string, disciplinas?: { id: string; nome: string }[]): string => {
  const hue = (disciplinaId.charCodeAt(0) * 137.5) % 360;
  return `hsl(${hue}, 70%, 60%)`;
};
