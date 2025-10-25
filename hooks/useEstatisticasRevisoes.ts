import { useMemo } from 'react';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { subDays, isAfter } from 'date-fns';

export const useEstatisticasRevisoes = () => {
    const revisoes = useRevisoesStore((state) => state.revisoes);

    const estatisticas = useMemo(() => {
        const agora = new Date();
        const umaSemanaAtras = subDays(agora, 7);
        const umMesAtras = subDays(agora, 30);

        const revisoesUltimaSemana = revisoes.filter(r => isAfter(new Date(r.data_prevista), umaSemanaAtras)).length;
        const revisoesUltimoMes = revisoes.filter(r => isAfter(new Date(r.data_prevista), umMesAtras)).length;

        return {
            revisoesUltimaSemana,
            revisoesUltimoMes,
        };
    }, [revisoes]);

    return estatisticas;
};
