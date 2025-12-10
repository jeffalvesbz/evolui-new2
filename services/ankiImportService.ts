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
 * Importa arquivo do Anki (formato .txt com tabs ou pipes)
 * Suporta:
 * - Formato com metadata: #separator:tab, #html:false
 * - Formato simples com pipe: Pergunta|Resposta
 * - Formato simples com tab: Pergunta[TAB]Resposta
 */
export const importAnkiFile = (content: string): AnkiImportResult => {
    // Normalizar quebras de linha para evitar problemas com formatos Windows/Mac/Linux misturados
    const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    console.log(`[AnkiImport] Iniciando importação. Total de linhas: ${lines.length}`);

    // Parse metadata (se existir)
    const metadata: { separator: string; htmlEnabled: boolean } = {
        separator: '', // Será detectado automaticamente
        htmlEnabled: false,
    };

    const cards: AnkiCard[] = [];
    const dataLines: string[] = []; // Linhas que contêm dados (não metadata)

    // Primeira passada: separar metadata das linhas de dados
    for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('#separator:')) {
            const val = trimmedLine.split(':')[1].trim().toLowerCase();
            if (val === 'tab') metadata.separator = '\t';
            else if (val === 'pipe') metadata.separator = '|';
            else if (val === 'comma') metadata.separator = ',';
            else if (val === 'semicolon') metadata.separator = ';';
            else metadata.separator = val;
            continue;
        }
        if (trimmedLine.startsWith('#html:')) {
            metadata.htmlEnabled = trimmedLine.split(':')[1].trim() === 'true';
            continue;
        }

        // Ignorar outras linhas de comentário e linhas vazias
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        dataLines.push(line); // Manter a linha original (não trimmed) para preservar tabs
    }

    console.log(`[AnkiImport] Linhas de dados: ${dataLines.length}, Separador declarado: '${metadata.separator || 'auto'}'`);

    // Se não foi declarado separador no metadata, detectar automaticamente
    if (!metadata.separator && dataLines.length > 0) {
        // Analisar as primeiras linhas para detectar o separador mais provável
        let tabCount = 0;
        let pipeCount = 0;

        const samplesToCheck = Math.min(5, dataLines.length);
        for (let i = 0; i < samplesToCheck; i++) {
            const line = dataLines[i];
            if (line.includes('\t')) tabCount++;
            if (line.includes('|')) pipeCount++;
        }

        // Usar o separador mais frequente
        if (tabCount >= pipeCount && tabCount > 0) {
            metadata.separator = '\t';
        } else if (pipeCount > 0) {
            metadata.separator = '|';
        } else {
            // Default para tab se nenhum separador encontrado
            metadata.separator = '\t';
        }

        console.log(`[AnkiImport] Separador auto-detectado: '${metadata.separator === '\t' ? 'TAB' : metadata.separator}' (tabs: ${tabCount}, pipes: ${pipeCount})`);
    }

    // Segunda passada: processar as linhas de dados
    for (const line of dataLines) {
        const parts = line.split(metadata.separator);

        if (parts.length >= 2) {
            let pergunta = parts[0].trim();
            let resposta = parts[1].trim();

            // Se houver mais partes, pode ser que a resposta contenha o separador
            // Nesse caso, juntar as partes restantes (exceto a última que pode ser tags)
            if (parts.length > 2) {
                // Verificar se a última parte parece ser tags (curta, sem espaços)
                const lastPart = parts[parts.length - 1].trim();
                if (lastPart.length < 50 && !lastPart.includes(' ')) {
                    // Provavelmente é tag, juntar do índice 1 até o penúltimo
                    resposta = parts.slice(1, -1).join(metadata.separator).trim();
                } else {
                    // Não é tag, juntar tudo após o primeiro campo
                    resposta = parts.slice(1).join(metadata.separator).trim();
                }
            }

            // Remove aspas se existirem (comum em exports CSV)
            pergunta = pergunta.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');
            resposta = resposta.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');

            // Converter HTML para texto se necessário
            if (metadata.htmlEnabled) {
                pergunta = stripHtml(pergunta);
                resposta = stripHtml(resposta);
            }

            if (pergunta && resposta) {
                cards.push({ pergunta, resposta });
            }
        }
    }

    console.log(`[AnkiImport] Finalizado. Cards processados: ${cards.length}. Separador usado: '${metadata.separator === '\t' ? 'TAB' : metadata.separator}'`);
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
