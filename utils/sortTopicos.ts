/**
 * Função para ordenação numérica natural de tópicos
 * Ordena tópicos que começam com números numericamente (1, 2, 10, 11...)
 * em vez de alfabeticamente (1, 10, 11, 2...)
 * Garante que tópicos principais apareçam antes de seus subtópicos
 */
export function sortTopicosPorNumero(topicos: Array<{ titulo: string }>): Array<{ titulo: string }> {
    return [...topicos].sort((a, b) => {
        const tituloA = a.titulo.trim();
        const tituloB = b.titulo.trim();

        const extractSequence = (titulo: string) => {
            const match = titulo.match(/^(\d+(?:\.\d+)*)([\s.)-]*)/);
            if (!match) {
                return null;
            }
            return {
                sequencia: match[1].split('.').map((parte) => parseInt(parte, 10)),
                resto: titulo.substring(match[0].length),
            };
        };

        const seqA = extractSequence(tituloA);
        const seqB = extractSequence(tituloB);

        if (seqA && seqB) {
            const tamanhoMinimo = Math.min(seqA.sequencia.length, seqB.sequencia.length);

            // Compara as partes comuns primeiro
            for (let i = 0; i < tamanhoMinimo; i++) {
                const parteA = seqA.sequencia[i];
                const parteB = seqB.sequencia[i];

                if (parteA !== parteB) {
                    return parteA - parteB;
                }
            }

            // Se uma sequência é prefixo da outra, a mais curta (tópico principal) vem primeiro
            if (seqA.sequencia.length !== seqB.sequencia.length) {
                return seqA.sequencia.length - seqB.sequencia.length;
            }

            // Se as sequências são idênticas, compara o resto do texto
            return seqA.resto.localeCompare(seqB.resto, 'pt-BR', { numeric: true, sensitivity: 'base' });
        }

        if (seqA && !seqB) {
            return -1;
        }

        if (!seqA && seqB) {
            return 1;
        }

        return tituloA.localeCompare(tituloB, 'pt-BR', { numeric: true, sensitivity: 'base' });
    });
}




