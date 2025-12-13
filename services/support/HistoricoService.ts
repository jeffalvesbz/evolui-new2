import { useEstudosStore } from '../../stores/useEstudosStore';
import { useStudyStore } from '../../stores/useStudyStore';
import { SessaoEstudo } from '../../types';

export const HistoricoService = {
  async delete(id: string, type: 'estudo' | 'simulado'): Promise<void> {
    if (type === 'estudo') {
      await useEstudosStore.getState().removeSessao(id);
    } else {
      await useStudyStore.getState().deleteSimulation(id);
    }
  },

  async update(id: string, type: 'estudo' | 'simulado', updates: any): Promise<void> {
    if (type === 'estudo') {
      const payload: Partial<Omit<SessaoEstudo, 'id'>> = {
        tempo_estudado: updates.duracao_minutos * 60,
        comentarios: updates.comentarios,
      };
      // Atualizar topico_id se fornecido
      if (updates.topico_id) {
        payload.topico_id = updates.topico_id;
      }
      await useEstudosStore.getState().updateSessao(id, payload);
    } else { // 'simulado'
      await useStudyStore.getState().updateSimulation(id, {
        name: updates.nome,
        durationMinutes: updates.duracao_minutos,
        notes: updates.comentarios,
        correct: updates.acertos,
        wrong: updates.erros,
        blank: updates.brancos,
      });
    }
  }
};