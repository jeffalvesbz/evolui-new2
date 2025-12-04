export interface AnkiCard {
    pergunta: string;
    resposta: string;
}

export interface AnkiImportResult {
    cards: AnkiCard[];
    metadata: {
        separator: string;
        htmlEnabled: boolean;
    };
}

/**
 * Importa arquivo do Anki (formato .txt com tabs)
 */
export const importAnkiFile = (content: string): AnkiImportResult => {
    const lines = content.split('\n');

    // Parse metadata
    const metadata = {
        separator: 'tab',
        htmlEnabled: false,
    };

    const cards: AnkiCard[] = [];

    for (const line of lines) {
        // Metadata
        if (line.startsWith('#separator:')) {
            metadata.separator = line.split(':')[1].trim();
            continue;
        }
        if (line.startsWith('#html:')) {
            metadata.htmlEnabled = line.split(':')[1].trim() === 'true';
            continue;
        }

        // Skip empty lines and comments
        if (!line.trim() || line.startsWith('#')) continue;

        // Parse card (tab-separated)
        const parts = line.split('\t');
        if (parts.length >= 2) {
            let pergunta = parts[0].trim();
            let resposta = parts[1].trim();

            // Remove aspas se existirem
            pergunta = pergunta.replace(/^"(.*)"$/, '$1');
            resposta = resposta.replace(/^"(.*)"$/, '$1');

            // Converter HTML para texto se necessário
            if (metadata.htmlEnabled) {
                pergunta = stripHtml(pergunta);
                resposta = stripHtml(resposta);
            }

            cards.push({ pergunta, resposta });
        }
    }

    return { cards, metadata };
};

/**
 * Remove tags HTML e converte para texto formatado
 */
function stripHtml(html: string): string {
    // Substituir <br> por quebra de linha
    let text = html.replace(/<br\s*\/?>/gi, '\n');

    // Substituir listas ordenadas por numeração
    text = text.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
        const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
        return '\n' + items.map((item: string, i: number) => {
            const itemText = item.replace(/<\/?li[^>]*>/gi, '').trim();
            return `${i + 1}. ${stripHtml(itemText)}`;
        }).join('\n') + '\n';
    });

    // Substituir listas não ordenadas por bullets
    text = text.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
        const items = content.match(/<li[^>]*>(.*?)<\/li>/gi) || [];
        return '\n' + items.map((item: string) => {
            const itemText = item.replace(/<\/?li[^>]*>/gi, '').trim();
            return `• ${stripHtml(itemText)}`;
        }).join('\n') + '\n';
    });

    // Preservar negrito e itálico como markdown
    text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
    text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
    text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');

    // Remover todas as outras tags HTML
    text = text.replace(/<[^>]+>/g, '');

    // Decodificar entidades HTML
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Limpar múltiplas quebras de linha
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}

/**
 * Valida arquivo Anki
 */
export const validateAnkiFile = (content: string): { valid: boolean; error?: string } => {
    if (!content.trim()) {
        return { valid: false, error: 'Arquivo vazio' };
    }

    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));

    if (lines.length === 0) {
        return { valid: false, error: 'Nenhum card encontrado no arquivo' };
    }

    // Verificar se pelo menos uma linha tem tab
    const hasTabSeparator = lines.some(l => l.includes('\t'));
    if (!hasTabSeparator) {
        return { valid: false, error: 'Formato inválido. Esperado: pergunta[TAB]resposta' };
    }

    return { valid: true };
};

/**
 * Extrai tags automáticas do conteúdo
 */
export const extractAutoTags = (pergunta: string, resposta: string): string[] => {
    const tags: string[] = ['anki'];

    const combined = (pergunta + ' ' + resposta).toLowerCase();

    // Detectar tipo de pergunta
    if (combined.includes('princípio')) tags.push('princípio');
    if (combined.includes('conceito')) tags.push('conceito');
    if (combined.includes('definição') || combined.includes('defina')) tags.push('definição');

    // Detectar áreas do direito
    const areas = ['penal', 'civil', 'constitucional', 'administrativo', 'tributário', 'processual'];
    areas.forEach(area => {
        if (combined.includes(area)) tags.push(area);
    });

    return [...new Set(tags)]; // Remove duplicatas
};
