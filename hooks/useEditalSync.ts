import { useEffect, useRef } from 'react';
import { useEditalStore } from '../stores/useEditalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useQuizStore } from '../stores/useQuizStore';
import { useFlashcardsStore } from '../stores/useFlashcardStore';

export const useEditalSync = () => {
    const editalAtivo = useEditalStore((state) => state.editalAtivo);
    const previousEditalIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Se não houver edital ativo, não faz nada
        if (!editalAtivo?.id) return;

        // Se o edital mudou (ou é a primeira carga)
        if (previousEditalIdRef.current !== editalAtivo.id) {
            console.log(`🔄 Sincronizando dados para o edital: ${editalAtivo.nome} (${editalAtivo.id})`);

            const editalId = editalAtivo.id;

            // 1. Carregar dados específicos do edital
            useDisciplinasStore.getState().fetchDisciplinas(editalId);
            useEstudosStore.getState().fetchSessoes(editalId, 300);
            useRevisoesStore.getState().fetchRevisoes(editalId);
            useCiclosStore.getState().fetchCiclos(editalId);

            // 2. Resetar estados que não devem persistir entre editais
            useQuizStore.getState().resetQuiz();
            useFlashcardsStore.getState().clearGeneratorState();

            // Atualizar ref
            previousEditalIdRef.current = editalId;
        }
    }, [editalAtivo]);
};
