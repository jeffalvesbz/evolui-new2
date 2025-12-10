// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { addDays, startOfDay } from 'date-fns';
import { Flashcard } from '../types';

const MIN_EASE_FACTOR = 1.3;

/**
 * Implements a simplified SM-2 algorithm for spaced repetition.
 * @param flashcard The flashcard being reviewed.
 * @param quality The quality of the user's response (0-5 scale).
 * @returns An object with the updated interval, easeFactor, and dueDate.
 */
export const calculateNextReview = (
    flashcard: Flashcard, 
    quality: 0 | 1 | 2 | 3 | 4 | 5
): Partial<Flashcard> => {
    
    const today = startOfDay(new Date());
    let { easeFactor, interval } = flashcard;
    let nextInterval: number;
    let nextEaseFactor: number;

    if (quality < 3) {
        // Incorrect response: Reset interval, penalize ease factor slightly.
        nextInterval = 1;
        nextEaseFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.2);
    } else {
        // Correct response: Calculate new ease factor and interval.
        nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
        if (nextEaseFactor < MIN_EASE_FACTOR) {
            nextEaseFactor = MIN_EASE_FACTOR;
        }

        if (interval <= 1) { // First time correct or after a lapse
            nextInterval = 1;
        } else if (interval < 6) { // Second consecutive time correct
            nextInterval = 6;
        } else {
            nextInterval = Math.ceil(interval * easeFactor);
        }
    }

    return {
        interval: nextInterval,
        easeFactor: nextEaseFactor,
        dueDate: addDays(today, nextInterval).toISOString(),
    };
};
