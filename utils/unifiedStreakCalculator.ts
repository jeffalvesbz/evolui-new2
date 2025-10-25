import { useMemo } from 'react';
import { useHistoricoStore } from '../stores/useHistoricoStore';

export const useUnifiedStreak = () => {
    const historico = useHistoricoStore((state) => state.historico);

    return useMemo(() => {
        if (!historico || historico.length === 0) {
            return { streak: 0, lastDay: null };
        }

        const studyDays = [...new Set(historico.map(s => new Date(s.data).toISOString().split('T')[0]))]
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => b.getTime() - a.getTime());

        if (studyDays.length === 0) {
            return { streak: 0, lastDay: null };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const lastStudyDay = studyDays[0];
        
        // Se o último dia de estudo não for hoje nem ontem, o streak é 0
        if (lastStudyDay.getTime() < yesterday.getTime()) {
            return { streak: 0, lastDay: lastStudyDay };
        }

        let currentStreak = 1;
        for (let i = 0; i < studyDays.length - 1; i++) {
            const currentDay = studyDays[i];
            const previousDay = studyDays[i+1];

            const diffTime = currentDay.getTime() - previousDay.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        return { streak: currentStreak, lastDay: lastStudyDay };
    }, [historico]);
};
