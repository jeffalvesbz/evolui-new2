
import { SessaoEstudo } from '../types';

export const calculateStreakFromSessoes = (sessoes: SessaoEstudo[]): number => {
    if (!sessoes || sessoes.length === 0) {
        return 0;
    }

    const studyDays = [...new Set(sessoes.map(s => s.data_estudo))]
        .map((dateStr: string) => new Date(`${dateStr}T00:00:00`))
        .sort((a, b) => b.getTime() - a.getTime());

    if (studyDays.length === 0) {
        return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const lastStudyDay = studyDays[0];
    
    // Se o último dia de estudo não for hoje nem ontem, o streak é 0
    if (lastStudyDay.getTime() < yesterday.getTime()) {
        return 0;
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
    
    return currentStreak;
};
