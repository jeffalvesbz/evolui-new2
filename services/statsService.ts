import { supabase } from './supabaseClient';
import { startOfMonth, endOfMonth } from 'date-fns';

/**
 * Conta quantos flashcards foram criados neste mês pelo usuário
 */
export async function countFlashcardsCreatedThisMonth(userId: string): Promise<number> {
    const start = startOfMonth(new Date()).toISOString();
    const end = endOfMonth(new Date()).toISOString();

    const { count, error } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', start)
        .lte('created_at', end);

    if (error) {
        console.error('Erro ao contar flashcards do mês:', error);
        return 0;
    }

    return count || 0;
}
