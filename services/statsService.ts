import { supabase } from './supabaseClient';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Conta quantos flashcards foram criados neste mês pelo usuário
 */
export async function countFlashcardsCreatedThisMonth(userId: string): Promise<number> {
    const start = startOfMonth(new Date()).toISOString();
    const end = endOfMonth(new Date()).toISOString();

    // Buscar do log de geração (contagem de IA)
    const { data, error } = await (supabase
        .from('flashcard_generation_log') as any)
        .select('count')
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end);

    if (error) {
        console.error('Erro ao contar flashcards do mês (log):', error);
        return 0;
    }

    // Somar contagem dos logs
    const total = (data as any[])?.reduce((sum, record) => sum + (record.count || 0), 0) || 0;
    return total;
}

/**
 * Registra a geração de flashcards via IA
 */
export async function recordFlashcardGeneration(userId: string, count: number): Promise<void> {
    const { error } = await (supabase
        .from('flashcard_generation_log') as any)
        .insert({
            user_id: userId,
            count: count
        });

    if (error) {
        console.error('Erro ao registrar geração de flashcards:', error);
        // Não lançar erro para não interromper o fluxo se o log falhar, mas logar console
    }
}
