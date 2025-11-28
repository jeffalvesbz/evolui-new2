import { supabase } from './supabaseClient';
import { FlashcardStats, FlashcardReview } from '../types';
import { startOfDay, subDays, format, differenceInDays, parseISO, addDays } from 'date-fns';

/**
 * Obtém estatísticas completas de flashcards para um usuário
 */
export const getFlashcardStats = async (userId: string, topicIds?: string[]): Promise<FlashcardStats> => {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 30);
    const sevenDaysAgo = subDays(today, 7);

    // Buscar reviews dos últimos 30 dias
    let query = supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('user_id', userId)
        .gte('reviewed_at', thirtyDaysAgo.toISOString())
        .order('reviewed_at', { ascending: false });

    const { data: reviews, error } = await query;

    if (error) throw error;

    let reviewsData = (reviews || []) as FlashcardReview[];

    // Se topicIds for fornecido, filtrar reviews
    if (topicIds && topicIds.length > 0) {
        // Buscar flashcards que pertencem aos tópicos fornecidos
        const { data: flashcards } = await supabase
            .from('flashcards')
            .select('id')
            .in('topico_id', topicIds);

        const flashcardIds = new Set(flashcards?.map(f => f.id) || []);
        reviewsData = reviewsData.filter(r => flashcardIds.has(r.flashcard_id));
    }

    // Calcular cards estudados hoje
    const cardsStudiedToday = reviewsData.filter(r => {
        const reviewDate = startOfDay(parseISO(r.reviewed_at));
        return reviewDate.getTime() === today.getTime();
    }).length;

    // Calcular cards estudados esta semana
    const cardsStudiedThisWeek = reviewsData.filter(r => {
        const reviewDate = parseISO(r.reviewed_at);
        return reviewDate >= sevenDaysAgo;
    }).length;

    // Calcular taxa de acerto (quality >= 3 = acerto)
    const totalReviews = reviewsData.length;
    const correctReviews = reviewsData.filter(r => r.quality >= 3).length;
    const accuracyRate = totalReviews > 0 ? Math.round((correctReviews / totalReviews) * 100) : 0;

    // Calcular streak (dias consecutivos estudando)
    const { currentStreak, bestStreak } = calculateStreaks(reviewsData);

    // Agrupar reviews por dia para o heatmap
    const reviewsByDay = groupReviewsByDay(reviewsData, thirtyDaysAgo, today);

    // Calcular acurácia por disciplina (requer join com flashcards e tópicos)
    const accuracyByDisciplina = await calculateAccuracyByDisciplina(userId, reviewsData);

    return {
        cardsStudiedToday,
        cardsStudiedThisWeek,
        totalReviews,
        accuracyRate,
        currentStreak,
        bestStreak,
        reviewsByDay,
        accuracyByDisciplina,
    };
};

/**
 * Salva uma revisão de flashcard no histórico
 */
export const saveFlashcardReview = async (
    review: Omit<FlashcardReview, 'id' | 'reviewed_at'>
): Promise<void> => {
    const { error } = await supabase
        .from('flashcard_reviews')
        .insert({
            ...review,
            reviewed_at: new Date().toISOString(),
        });

    if (error) throw error;
};

/**
 * Calcula streaks (dias consecutivos estudando)
 */
function calculateStreaks(reviews: FlashcardReview[]): { currentStreak: number; bestStreak: number } {
    if (reviews.length === 0) return { currentStreak: 0, bestStreak: 0 };

    // Agrupar por dia único
    const uniqueDays = new Set(
        reviews.map(r => format(parseISO(r.reviewed_at), 'yyyy-MM-dd'))
    );
    const sortedDays = Array.from(uniqueDays).sort().reverse();

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 1;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    // Calcular current streak
    if (sortedDays[0] === today || sortedDays[0] === yesterday) {
        currentStreak = 1;
        for (let i = 1; i < sortedDays.length; i++) {
            const diff = differenceInDays(parseISO(sortedDays[i - 1]), parseISO(sortedDays[i]));
            if (diff === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calcular best streak
    for (let i = 1; i < sortedDays.length; i++) {
        const diff = differenceInDays(parseISO(sortedDays[i - 1]), parseISO(sortedDays[i]));
        if (diff === 1) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            tempStreak = 1;
        }
    }

    bestStreak = Math.max(bestStreak, currentStreak, 1);

    return { currentStreak, bestStreak };
}

/**
 * Agrupa reviews por dia para o heatmap
 */
function groupReviewsByDay(
    reviews: FlashcardReview[],
    startDate: Date,
    endDate: Date
): { date: string; count: number }[] {
    const dayMap = new Map<string, number>();

    // Inicializar todos os dias com 0
    let currentDate = startDate;
    while (currentDate <= endDate) {
        dayMap.set(format(currentDate, 'yyyy-MM-dd'), 0);
        currentDate = addDays(currentDate, 1);
    }

    // Contar reviews por dia
    reviews.forEach(review => {
        const day = format(parseISO(review.reviewed_at), 'yyyy-MM-dd');
        if (dayMap.has(day)) {
            dayMap.set(day, (dayMap.get(day) || 0) + 1);
        }
    });

    return Array.from(dayMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calcula acurácia por disciplina
 */
async function calculateAccuracyByDisciplina(
    userId: string,
    reviews: FlashcardReview[]
): Promise<{ disciplinaId: string; nome: string; accuracy: number }[]> {
    if (reviews.length === 0) return [];

    // Buscar flashcards com seus tópicos e disciplinas
    const flashcardIds = [...new Set(reviews.map(r => r.flashcard_id))];

    const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select(`
      id,
      topico_id,
      topicos!inner (
        id,
        disciplina_id,
        disciplinas!inner (
          id,
          nome
        )
      )
    `)
        .in('id', flashcardIds);

    if (error) {
        console.error('Error fetching flashcards for accuracy:', error);
        return [];
    }

    // Agrupar reviews por disciplina
    const disciplinaMap = new Map<string, { nome: string; correct: number; total: number }>();

    reviews.forEach(review => {
        const flashcard = (flashcards as any)?.find((f: any) => f.id === review.flashcard_id);
        if (!flashcard?.topicos?.disciplinas) return;

        const disciplinaId = flashcard.topicos.disciplinas.id;
        const disciplinaNome = flashcard.topicos.disciplinas.nome;

        if (!disciplinaMap.has(disciplinaId)) {
            disciplinaMap.set(disciplinaId, { nome: disciplinaNome, correct: 0, total: 0 });
        }

        const stats = disciplinaMap.get(disciplinaId)!;
        stats.total++;
        if (review.quality >= 3) stats.correct++;
    });

    return Array.from(disciplinaMap.entries()).map(([disciplinaId, stats]) => ({
        disciplinaId,
        nome: stats.nome,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
}
