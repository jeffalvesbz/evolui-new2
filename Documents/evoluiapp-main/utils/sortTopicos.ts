/**
 * Função para ordenação numérica natural de tópicos
 * Ordena tópicos que começam com números numericamente (1, 2, 10, 11...)
 * em vez de alfabeticamente (1, 10, 11, 2...)
 */
export function sortTopicosPorNumero(topicos: Array<{ titulo: string }>): Array<{ titulo: string }> {
    return [...topicos].sort((a, b) => {
        const tituloA = a.titulo.trim();
        const tituloB = b.titulo.trim();
        
        // Extrair número do início do título (se houver)
        const matchA = tituloA.match(/^(\d+)\.?\s*/);
        const matchB = tituloB.match(/^(\d+)\.?\s*/);
        
        // Se ambos começam com número, ordenar numericamente
        if (matchA && matchB) {
            const numA = parseInt(matchA[1], 10);
            const numB = parseInt(matchB[1], 10);
            if (numA !== numB) {
                return numA - numB;
            }
            // Se os números são iguais, ordenar pelo resto do texto
            const restoA = tituloA.substring(matchA[0].length);
            const restoB = tituloB.substring(matchB[0].length);
            return restoA.localeCompare(restoB, 'pt-BR', { numeric: true, sensitivity: 'base' });
        }
        
        // Se apenas A começa com número, A vem primeiro
        if (matchA && !matchB) {
            return -1;
        }
        
        // Se apenas B começa com número, B vem primeiro
        if (!matchA && matchB) {
            return 1;
        }
        
        // Se nenhum começa com número, ordenar alfabeticamente
        return tituloA.localeCompare(tituloB, 'pt-BR', { numeric: true, sensitivity: 'base' });
    });
}



