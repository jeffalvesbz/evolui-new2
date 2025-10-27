import { useGamificationStore } from '../stores/useGamificationStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';

export const checkAndAwardBadges = () => {
  const { stats, badges, unlockBadges, xpLog } = useGamificationStore.getState();
  const { sessoes } = useEstudosStore.getState();
  const { revisoes } = useRevisoesStore.getState();
  const { erros } = useCadernoErrosStore.getState();
  const { getAverageProgress } = useDisciplinasStore.getState();

  if (!stats || badges.length === 0) return;

  const unlockedIds = new Set(stats.unlockedBadgeIds);
  const lockedBadges = badges.filter(b => !unlockedIds.has(b.id));

  if (lockedBadges.length === 0) return;

  const newlyUnlocked = [];

  // --- Pre-calculate metrics for efficiency ---
  const totalSegundosEstudo = sessoes.reduce((acc, s) => acc + s.tempo_estudado, 0);
  const totalHorasEstudo = totalSegundosEstudo / 3600;
  
  const revisoesFlashcardConcluidas = revisoes.filter(r => r.status === 'concluida' && r.origem === 'flashcard').length;
  
  const sessoesPorDia = sessoes.reduce((acc, sessao) => {
    const dia = sessao.data_estudo;
    if (!acc[dia]) acc[dia] = 0;
    acc[dia] += sessao.tempo_estudado;
    return acc;
  }, {} as Record<string, number>);
  const maxHorasDia = Math.max(0, ...Object.values(sessoesPorDia)) / 3600;

  const revisoesAtrasadasConcluidas = xpLog.filter(log => log.event === 'revisao_atrasada').length;


  for (const badge of lockedBadges) {
    let criteriaMet = false;
    switch (badge.id) {
      case 'badge-1': // Primeiros Passos
        if (sessoes.length >= 1) criteriaMet = true;
        break;
      case 'badge-2': // Maratonista
        if (totalHorasEstudo >= 10) criteriaMet = true;
        break;
      case 'badge-3': // Sequência de 7 Dias
        // FIX: Cast `current_streak_days` to a number to handle potential `unknown` type during hydration from zustand persist middleware.
        if (Number(stats.current_streak_days) >= 7) criteriaMet = true;
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
      
      // New public achievements
      case 'badge-7': // Mestre do Tempo (50h)
        if (totalHorasEstudo >= 50) criteriaMet = true;
        break;
      
      case 'badge-8': // Senhor do Tempo (100h)
        if (totalHorasEstudo >= 100) criteriaMet = true;
        break;
      
      case 'badge-9': // Guardião da Memória (500 flashcards)
        if (revisoesFlashcardConcluidas >= 500) criteriaMet = true;
        break;
          
      case 'badge-10': // A Lenda (100 day streak)
        // FIX: Cast `current_streak_days` to a number to handle potential `unknown` type during hydration from zustand persist middleware.
        if (Number(stats.current_streak_days) >= 100) criteriaMet = true;
        break;

      case 'badge-11': // Imparável (10h in a day)
        if (maxHorasDia >= 10) criteriaMet = true;
        break;
          
      case 'badge-12': // Exterminador de Débitos (20 late revisions)
        if (revisoesAtrasadasConcluidas >= 20) criteriaMet = true;
        break;
      
      // Secret Achievements
      case 'badge-secret-2': // Interestelar (5 hour session)
        if (sessoes.some(s => s.tempo_estudado >= 5 * 3600)) {
          criteriaMet = true;
        }
        break;
      case 'badge-secret-3': // Memento Vivere (30 day streak)
        // stats.current_streak_days is calculated from sessoes and should be the source of truth
        // FIX: Cast `current_streak_days` to a number to handle potential `unknown` type during hydration from zustand persist middleware.
        if (Number(stats.current_streak_days) >= 30) {
          criteriaMet = true;
        }
        break;
      case 'badge-secret-4': // O Sábio
        const errosDificeisResolvidos = erros.filter(e => e.resolvido && e.nivelDificuldade === 'difícil').length;
        if (errosDificeisResolvidos >= 10) {
          criteriaMet = true;
        }
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