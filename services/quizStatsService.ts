import { supabase } from './supabaseClient';

/**
 * Conta quantas questões de quiz foram geradas hoje pelo usuário
 */
export async function countQuizQuestionsToday(userId: string): Promise<number> {
    if (!userId || userId.trim() === '') {
        console.warn('countQuizQuestionsToday chamado com userId vazio, retornando 0');
        return 0;
    }
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const { data, error } = await supabase
            .from('quiz_generation_log')
            .select('question_count')
            .eq('user_id', userId)
            .gte('created_at', todayISO);

        if (error) {
            console.error('Erro ao contar questões de quiz:', error);
            return 0;
        }

        // Somar todas as questões geradas hoje
        const total = data?.reduce((sum, record) => sum + (record.question_count || 0), 0) || 0;
        return total;
    } catch (error) {
        console.error('Erro ao contar questões de quiz (catch):', error);
        return 0;
    }
}

/**
 * Registra a geração de questões de quiz no banco de dados
 */
export async function recordQuizGeneration(
    userId: string,
    questionCount: number
): Promise<void> {
    try {
        const { error } = await supabase
            .from('quiz_generation_log')
            .insert({
                user_id: userId,
                question_count: questionCount,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Erro ao registrar geração de quiz:', error);
            throw error;
        }
    } catch (error) {
        console.error('Erro ao registrar geração de quiz (catch):', error);
        throw error;
    }
}
