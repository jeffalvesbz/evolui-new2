import { addDays, differenceInHours } from 'date-fns';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { Revisao } from '../types';

export type ScheduleRevisionInput = {
  disciplinaId: string;
  disciplinaNome: string;
  topicoId: string;
  topicoNome?: string | null;
  referencia?: Date | string;
  intervals?: number[]; // Intervalos customizados em dias
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
  intervals,
}: ScheduleRevisionInput): Promise<Revisao[]> => {
  const { addRevisao, revisoes } = useRevisoesStore.getState();

  const base = typeof referencia === 'string' ? new Date(referencia) : referencia;
  // Spaced Repetition System intervals - usa intervalos customizados ou padrão
  const intervalsToUse = intervals && intervals.length > 0 ? intervals : [1, 7, 15, 30];

  const makeRevision = (days: number): Omit<Revisao, 'id' | 'studyPlanId'> => ({
    topico_id: topicoId,
    disciplinaId,
    conteudo: topicoNome || disciplinaNome,
    data_prevista: addDays(base, days).toISOString(),
    status: 'pendente',
    origem: 'teorica',
    dificuldade: 'médio',
  });

  const existingPendingRevisions = revisoes.filter(r =>
    r.topico_id === topicoId &&
    r.origem === 'teorica' &&
    r.status === 'pendente'
  );

  const newItemsToCreate = [];
  for (const days of intervalsToUse) {
    const targetDate = addDays(base, days);

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