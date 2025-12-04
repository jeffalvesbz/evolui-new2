/**
 * Formata texto em Title Case (primeira letra de cada palavra maiúscula)
 * Preserva siglas em maiúsculas (ex: TCDF, CEBRASPE, PDF)
 */
export const formatarTitleCase = (texto: string): string => {
    if (!texto) return '';
    return texto
        .split(' ')
        .map(palavra => {
            if (!palavra) return palavra;
            // Manter siglas em maiúsculas (ex: TCDF, CEBRASPE)
            if (palavra === palavra.toUpperCase() && palavra.length > 1) {
                return palavra;
            }
            // Primeira letra maiúscula, resto minúscula
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        })
        .join(' ');
};

/**
 * Handler para input que formata automaticamente em Title Case
 * Útil para usar com onChange de inputs de texto
 */
export const handleTitleCaseInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setValue: (value: string) => void
) => {
    const valor = e.target.value;
    // Só formata quando o usuário termina de digitar uma palavra (espaço ou fim)
    // Para não interferir enquanto digita
    const palavras = valor.split(' ');
    const ultimaPalavra = palavras[palavras.length - 1];
    
    // Se a última palavra está sendo digitada (não terminou com espaço), não formata ainda
    // Formata apenas palavras completas
    const palavrasFormatadas = palavras.slice(0, -1).map(p => formatarTitleCase(p));
    const valorFormatado = [...palavrasFormatadas, ultimaPalavra].join(' ');
    
    setValue(valorFormatado);
};

/**
 * Handler mais simples que formata tudo em tempo real
 */
export const handleTitleCaseInputRealTime = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    setValue: (value: string) => void
) => {
    const valor = e.target.value;
    // Formata tudo em tempo real, mas preserva a posição do cursor
    const cursorPos = e.target.selectionStart || 0;
    const valorFormatado = formatarTitleCase(valor);
    setValue(valorFormatado);
    
    // Restaurar posição do cursor após formatação
    setTimeout(() => {
        e.target.setSelectionRange(cursorPos, cursorPos);
    }, 0);
};



