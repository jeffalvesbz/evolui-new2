// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { addDays, startOfDay } from 'date-fns';
import { Flashcard } from '../types';

const MIN_EASE_FACTOR = 1.3;

// A simplified SM-2 inspired algorithm
export const calculateNextReview = (
    flashcard: Flashcard, 
    result: 'correct' | 'incorrect'
): Partial<Flashcard> => {
    
    const today = startOfDay(new Date());

    if (result === 'incorrect') {
        // Card was answered incorrectly, reset interval and penalize ease factor
        return {
            interval: 1, // Reset interval to 1 day
            easeFactor: Math.max(MIN_EASE_FACTOR, flashcard.easeFactor - 0.2), // Decrease ease
            dueDate: addDays(today, 1).toISOString(), // Due tomorrow
        };
    } else {
        // Card was answered correctly
        let nextInterval: number;
        if (flashcard.interval < 1) {
            // First time correct after a lapse or new card
             nextInterval = 1;
        } else if (flashcard.interval === 1) {
            // Second consecutive time correct
            nextInterval = 6;
        } else {
            // Subsequent correct answers
            nextInterval = Math.round(flashcard.interval * flashcard.easeFactor);
        }
        
        // Add a small bonus to ease factor for correct answers
        const nextEaseFactor = flashcard.easeFactor + 0.1;

        return {
            interval: nextInterval,
            easeFactor: nextEaseFactor,
            dueDate: addDays(today, nextInterval).toISOString(),
        };
    }
};