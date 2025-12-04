import { addDays, differenceInHours } from 'date-fns';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { Revisao } from '../types';

export type ScheduleRevisionInput = {
  disciplinaId: string;
  disciplinaNome: string;
  topicoId: string;
  topicoNome?: string | null;
  referencia?: Date | string;
<<<<<<< HEAD
  intervals?: number[]; // Intervalos customizados em dias
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
};

/**
 * Lightweight auto-revision scheduler (D+1, D+7, D+15, D+30)
 * Pushes revisions into useRevisoesStore to keep UI in sync immediately.
 * Checks for existing pending revisions to avoid duplicates.
 * @param input - The details of the topic to schedule revisions for.
 * @returns A promise that resolves with the array of created revisions.
 */
export const scheduleAutoRevisoes = async ({
  disciplinaId,
  disciplinaNome,
  topicoId,
  topicoNome = null,
  referencia = new Date(),
<<<<<<< HEAD
  intervals,
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
}: ScheduleRevisionInput): Promise<Revisao[]> => {
  const { addRevisao, revisoes } = useRevisoesStore.getState();

  const base = typeof referencia === 'string' ? new Date(referencia) : referencia;
<<<<<<< HEAD
  // Spaced Repetition System intervals - usa intervalos customizados ou padrão
  const intervalsToUse = intervals && intervals.length > 0 ? intervals : [1, 7, 15, 30];
=======
  // Spaced Repetition System intervals
  const intervals = [1, 7, 15, 30]; 
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

  const makeRevision = (days: number): Omit<Revisao, 'id' | 'studyPlanId'> => ({
    topico_id: topicoId,
    disciplinaId,
<<<<<<< HEAD
    conteudo: topicoNome || disciplinaNome,
=======
    conteudo: `Revisão de ${days} dia(s): ${topicoNome || disciplinaNome}`,
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    data_prevista: addDays(base, days).toISOString(),
    status: 'pendente',
    origem: 'teorica',
    dificuldade: 'médio',
  });
<<<<<<< HEAD

  const existingPendingRevisions = revisoes.filter(r =>
    r.topico_id === topicoId &&
=======
  
  const existingPendingRevisions = revisoes.filter(r => 
    r.topico_id === topicoId && 
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    r.origem === 'teorica' &&
    r.status === 'pendente'
  );

  const newItemsToCreate = [];
<<<<<<< HEAD
  for (const days of intervalsToUse) {
    const targetDate = addDays(base, days);

=======
  for (const days of intervals) {
    const targetDate = addDays(base, days);
    
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    const hasExisting = existingPendingRevisions.some(existing => {
      // Check if there is an existing pending review for roughly the same day
      return Math.abs(differenceInHours(new Date(existing.data_prevista), targetDate)) < 12;
    });

    if (!hasExisting) {
      newItemsToCreate.push(makeRevision(days));
    }
  }

  if (newItemsToCreate.length === 0) {
    return [];
  }

  const createdRevisions = await Promise.all(newItemsToCreate.map(item => addRevisao(item)));

  return createdRevisions;
};