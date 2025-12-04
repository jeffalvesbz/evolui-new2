/**
 * Utilitários para manipulação de datas com suporte a fuso horário local
 */

/**
 * Retorna a data atual no formato ISO (YYYY-MM-DD) usando o fuso horário LOCAL,
 * não UTC. Isso evita problemas onde a data muda antes da meia-noite local.
 * 
 * Por exemplo, no Brasil (UTC-3), às 21:00 local já é meia-noite em UTC,
 * fazendo com que toISOString() retorne o dia seguinte.
 * 
 * @param date - Data a ser formatada (padrão: data/hora atual)
 * @returns String no formato YYYY-MM-DD no fuso horário local
 */
export function getLocalDateISO(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Retorna a data de ontem no formato ISO (YYYY-MM-DD) usando o fuso horário LOCAL
 * 
 * @returns String no formato YYYY-MM-DD representando ontem
 */
export function getYesterdayLocalDateISO(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return getLocalDateISO(yesterday);
}

/**
 * Retorna a data de amanhã no formato ISO (YYYY-MM-DD) usando o fuso horário LOCAL
 * 
 * @returns String no formato YYYY-MM-DD representando amanhã
 */
export function getTomorrowLocalDateISO(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return getLocalDateISO(tomorrow);
}

/**
 * Converte uma data ISO (YYYY-MM-DD) para um objeto Date no fuso horário local
 * 
 * @param isoDate - Data no formato YYYY-MM-DD
 * @returns Objeto Date representando a data no fuso horário local
 */
export function parseLocalDateISO(isoDate: string): Date {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day);
}
