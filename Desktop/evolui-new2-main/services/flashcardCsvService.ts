import { Flashcard } from '../types';

export interface CsvFlashcard {
    pergunta: string;
    resposta: string;
    tags: string;
    topico_id: string;
}

/**
 * Exporta flashcards para formato CSV
 */
export const exportFlashcardsToCSV = (flashcards: Flashcard[]): string => {
    const headers = ['pergunta', 'resposta', 'tags', 'topico_id'];
    const rows = flashcards.map(fc => [
        escapeCsvField(fc.pergunta),
        escapeCsvField(fc.resposta),
        escapeCsvField((fc.tags || []).join(';')),
        fc.topico_id,
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(row => row.join(',')),
    ].join('\n');

    return csv;
};

/**
 * Baixa CSV como arquivo
 */
export const downloadCSV = (csv: string, filename: string = 'flashcards.csv') => {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Detecta o formato do arquivo (CSV ou TXT)
 */
function detectFileFormat(content: string): 'csv' | 'txt' {
    const firstLine = content.trim().split('\n')[0];

    // Se contém pipe ou tab, provavelmente é TXT
    if (firstLine.includes('|') || firstLine.includes('\t')) {
        return 'txt';
    }

    // Se contém vírgula ou ponto e vírgula, provavelmente é CSV
    if (firstLine.includes(',') || firstLine.includes(';')) {
        return 'csv';
    }

    // Default para TXT se não detectar
    return 'txt';
}

/**
 * Detecta o delimitador mais provável (vírgula ou ponto e vírgula)
 */
function detectDelimiter(line: string): string {
    const commas = (line.match(/,/g) || []).length;
    const semicolons = (line.match(/;/g) || []).length;
    return semicolons > commas ? ';' : ',';
}

/**
 * Importa flashcards de arquivo TXT
 * Formato esperado: pergunta|resposta ou pergunta\tresposta (uma por linha)
 */
export const importFlashcardsFromTXT = (txtContent: string): CsvFlashcard[] => {
    const lines = txtContent.trim().split('\n').filter(line => line.trim());

    if (lines.length < 1) {
        throw new Error('Arquivo TXT vazio ou inválido');
    }

    const flashcards: CsvFlashcard[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detectar separador (pipe ou tab)
        let parts: string[];
        if (line.includes('|')) {
            parts = line.split('|');
        } else if (line.includes('\t')) {
            parts = line.split('\t');
        } else {
            console.warn(`Linha ${i + 1} ignorada: formato inválido (use | ou tab como separador)`);
            continue;
        }

        if (parts.length < 2) {
            console.warn(`Linha ${i + 1} ignorada: número de campos insuficiente`);
            continue;
        }

        const pergunta = parts[0]?.trim() || '';
        const resposta = parts[1]?.trim() || '';
        const tags = parts[2]?.trim() || '';
        const topico_id = parts[3]?.trim() || '';

        // Validar campos obrigatórios
        if (!pergunta || !resposta) {
            console.warn(`Linha ${i + 1} ignorada: pergunta ou resposta vazia`);
            continue;
        }

        flashcards.push({
            pergunta,
            resposta,
            tags,
            topico_id,
        });
    }

    if (flashcards.length === 0) {
        throw new Error('Nenhum flashcard válido encontrado no arquivo TXT');
    }

    return flashcards;
};

/**
 * Importa flashcards de arquivo CSV ou TXT (auto-detecta formato)
 */
export const importFlashcardsFromCSV = (content: string): CsvFlashcard[] => {
    const format = detectFileFormat(content);

    if (format === 'txt') {
        return importFlashcardsFromTXT(content);
    }

    // Processar como CSV
    const lines = content.trim().split('\n').filter(line => line.trim());

    if (lines.length < 1) {
        throw new Error('CSV vazio ou inválido');
    }

    const delimiter = detectDelimiter(lines[0]);
    const firstLineValues = parseCsvLine(lines[0], delimiter);
    const headers = firstLineValues.map(h => h.trim().toLowerCase());

    const hasHeaders = headers.includes('pergunta') && headers.includes('resposta');

    const flashcards: CsvFlashcard[] = [];
    const startIndex = hasHeaders ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const values = parseCsvLine(lines[i], delimiter);

        // Se tiver headers, usa o mapeamento, senão usa posição fixa
        // Posição fixa: 0=Pergunta, 1=Resposta, 2=Tags, 3=TopicoID
        let pergunta = '';
        let resposta = '';
        let tags = '';
        let topico_id = '';

        if (hasHeaders) {
            const pIdx = headers.indexOf('pergunta');
            const rIdx = headers.indexOf('resposta');
            const tIdx = headers.indexOf('tags');
            const topIdx = headers.indexOf('topico_id');

            pergunta = values[pIdx]?.trim() || '';
            resposta = values[rIdx]?.trim() || '';
            tags = tIdx !== -1 ? values[tIdx]?.trim() || '' : '';
            topico_id = topIdx !== -1 ? values[topIdx]?.trim() || '' : '';
        } else {
            if (values.length < 2) {
                console.warn(`Linha ${i + 1} ignorada: número de colunas insuficiente`);
                continue;
            }
            pergunta = values[0]?.trim() || '';
            resposta = values[1]?.trim() || '';
            tags = values[2]?.trim() || '';
            topico_id = values[3]?.trim() || '';
        }

        // Validar campos obrigatórios
        if (!pergunta || !resposta) {
            console.warn(`Linha ${i + 1} ignorada: pergunta ou resposta vazia`);
            continue;
        }

        flashcards.push({
            pergunta,
            resposta,
            tags,
            topico_id,
        });
    }

    if (flashcards.length === 0) {
        throw new Error('Nenhum flashcard válido encontrado no CSV');
    }

    return flashcards;
};

/**
 * Escapa campo CSV (adiciona aspas se necessário)
 */
function escapeCsvField(field: string): string {
    const stringField = String(field || '');
    if (stringField.includes(',') || stringField.includes(';') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

/**
 * Parse linha CSV (lida com aspas e delimitadores dentro de campos)
 */
function parseCsvLine(line: string, delimiter: string = ','): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Aspas duplas escapadas
                current += '"';
                i++;
            } else {
                // Toggle modo aspas
                inQuotes = !inQuotes;
            }
        } else if (char === delimiter && !inQuotes) {
            // Separador de campo
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * Valida formato do arquivo (CSV ou TXT) antes de importar
 */
export const validateCsvFormat = (content: string): { valid: boolean; error?: string } => {
    try {
        const lines = content.trim().split('\n').filter(l => l.trim());

        if (lines.length < 1) {
            return { valid: false, error: 'O arquivo está vazio' };
        }

        const format = detectFileFormat(content);

        if (format === 'txt') {
            // Validar formato TXT
            const firstLine = lines[0];
            if (!firstLine.includes('|') && !firstLine.includes('\t')) {
                return {
                    valid: false,
                    error: 'Formato TXT inválido. Use | ou tab para separar pergunta e resposta. Exemplo: "Pergunta|Resposta"'
                };
            }
            return { valid: true };
        }

        // Validar formato CSV
        const delimiter = detectDelimiter(lines[0]);
        const firstLineValues = parseCsvLine(lines[0], delimiter);

        // Se tiver headers, ótimo. Se não, precisa ter pelo menos 2 colunas.
        const headers = firstLineValues.map(h => h.trim().toLowerCase());
        const hasHeaders = headers.includes('pergunta') && headers.includes('resposta');

        if (!hasHeaders && firstLineValues.length < 2) {
            return {
                valid: false,
                error: 'Formato CSV inválido. O arquivo deve ter cabeçalhos "pergunta,resposta" OU pelo menos 2 colunas de dados.'
            };
        }

        return { valid: true };
    } catch (error: any) {
        return { valid: false, error: error.message };
    }
};

