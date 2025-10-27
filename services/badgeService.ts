
import { useGamificationStore } from '../stores/useGamificationStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { calculateStreakFromSessoes } from '../utils/calculateStreak';

export const checkAndAwardBadges = () => {
  const { stats, badges, unlockBadges } = useGamificationStore.getState();
  const { sessoes } = useEstudosStore.getState();
  const { revisoes } = useRevisoesStore.getState();
  const { erros } = useCadernoErrosStore.getState();
  const { getAverageProgress } = useDisciplinasStore.getState();

  if (!stats || badges.length === 0) return;

  const unlockedIds = new Set(stats.unlockedBadgeIds);
  const lockedBadges = badges.filter(b => !unlockedIds.has(b.id));

  if (lockedBadges.length === 0) return;

  const newlyUnlocked = [];

  for (const badge of lockedBadges) {
    let criteriaMet = false;
    switch (badge.id) {
      case 'badge-1': // Primeiros Passos
        if (sessoes.length >= 1) criteriaMet = true;
        break;
      case 'badge-2': // Maratonista
        const totalSegundos = sessoes.reduce((acc, s) => acc + s.tempo_estudado, 0);
        if (totalSegundos >= 10 * 3600) criteriaMet = true;
        break;
      case 'badge-3': // Sequência de 7 Dias
        const streak = calculateStreakFromSessoes(sessoes);
        if (streak >= 7) criteriaMet = true;
        break;
      case 'badge-4': // Revisor Dedicado
        const revisoesConcluidas = revisoes.filter(r => r.status === 'concluida').length;
        if (revisoesConcluidas >= 10) criteriaMet = true;
        break;
      case 'badge-5': // Caça-Erros
        if (erros.length >= 5) criteriaMet = true;
        break;
      case 'badge-6': // Edital Concluído
        if (getAverageProgress() >= 100) criteriaMet = true;
        break;
    }

    if (criteriaMet) {
      newlyUnlocked.push(badge);
    }
  }

  if (newlyUnlocked.length > 0) {
    unlockBadges(newlyUnlocked);
  }
};
