import { addDays } from 'date-fns';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { Revisao } from '../types';

export type ScheduleRevisionInput = {
  disciplinaId: string;
  disciplinaNome: string;
  topicoId: string;
  topicoNome?: string | null;
  referencia?: Date | string;
};

/**
 * Lightweight auto-revision scheduler (D+1, D+7, D+15, D+30)
 * Pushes revisions into useRevisoesStore to keep UI in sync immediately.
 * @param input - The details of the topic to schedule revisions for.
 * @returns A promise that resolves with the array of created revisions.
 */
export const scheduleAutoRevisoes = async ({
  disciplinaId,
  disciplinaNome,
  topicoId,
  topicoNome = null,
  referencia = new Date(),
}: ScheduleRevisionInput): Promise<Revisao[]> => {
  const { addRevisao } = useRevisoesStore.getState();

  const base = typeof referencia === 'string' ? new Date(referencia) : referencia;
  // Spaced Repetition System intervals
  const intervals = [1, 7, 15, 30]; 

  const makeRevision = (days: number): Omit<Revisao, 'id'> => ({
    topico_id: topicoId,
    disciplinaId,
    conteudo: `Revisão de ${days} dia(s): ${topicoNome || disciplinaNome}`,
    data_prevista: addDays(base, days).toISOString(),
    status: 'pendente',
    origem: 'teorica',
    dificuldade: 'médio',
  });

  const newItems = intervals.map(makeRevision);
  
  const createdRevisions = await Promise.all(newItems.map(item => addRevisao(item)));

  return createdRevisions;
};
