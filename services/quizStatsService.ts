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
        // Usar data local no formato YYYY-MM-DD para evitar problemas de timezone
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayLocalStr = `${year}-${month}-${day}`;

        // Buscar registros onde a data (extraída de created_at) é igual a hoje
        // Usamos uma abordagem que funciona com timezone do servidor
        const startOfDayUTC = new Date(`${todayLocalStr}T00:00:00`);
        const endOfDayUTC = new Date(`${todayLocalStr}T23:59:59.999`);

        const { data, error } = await supabase
            .from('quiz_generation_log')
            .select('question_count, created_at')
            .eq('user_id', userId)
            .gte('created_at', startOfDayUTC.toISOString())
            .lte('created_at', endOfDayUTC.toISOString()) as unknown as { data: { question_count: number; created_at: string }[] | null; error: any };

        if (error) {
            console.error('Erro ao contar questões de quiz:', error);
            return 0;
        }

        // Somar todas as questões geradas hoje
        const total = data?.reduce((sum, record) => sum + (record.question_count || 0), 0) || 0;

        console.log(`[QuizStats] Usuário ${userId.substring(0, 8)}... gerou ${total} questões hoje (${todayLocalStr})`);

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
            } as any);

        if (error) {
            console.error('Erro ao registrar geração de quiz:', error);
            throw error;
        }
    } catch (error) {
        console.error('Erro ao registrar geração de quiz (catch):', error);
        throw error;
    }
}
