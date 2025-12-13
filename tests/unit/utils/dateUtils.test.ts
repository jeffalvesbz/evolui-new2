import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getLocalDateISO,
    getYesterdayLocalDateISO,
    getTomorrowLocalDateISO,
    parseLocalDateISO,
} from '../../../utils/dateUtils';

describe('dateUtils', () => {
    describe('getLocalDateISO', () => {
        it('should return current date in YYYY-MM-DD format', () => {
            const result = getLocalDateISO();
            // Verificar formato YYYY-MM-DD
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should return specific date in correct format', () => {
            const testDate = new Date(2024, 0, 15); // 15 de janeiro de 2024
            const result = getLocalDateISO(testDate);
            expect(result).toBe('2024-01-15');
        });

        it('should pad month and day with zeros', () => {
            const testDate = new Date(2024, 0, 5); // 5 de janeiro
            const result = getLocalDateISO(testDate);
            expect(result).toBe('2024-01-05');
        });

        it('should handle December correctly', () => {
            const testDate = new Date(2024, 11, 25); // 25 de dezembro
            const result = getLocalDateISO(testDate);
            expect(result).toBe('2024-12-25');
        });
    });

    describe('getYesterdayLocalDateISO', () => {
        it('should return yesterday date', () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const expected = getLocalDateISO(yesterday);
            const result = getYesterdayLocalDateISO();

            expect(result).toBe(expected);
        });
    });

    describe('getTomorrowLocalDateISO', () => {
        it('should return tomorrow date', () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const expected = getLocalDateISO(tomorrow);
            const result = getTomorrowLocalDateISO();

            expect(result).toBe(expected);
        });
    });

    describe('parseLocalDateISO', () => {
        it('should parse YYYY-MM-DD string to Date', () => {
            const result = parseLocalDateISO('2024-06-15');

            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(5); // Junho = 5 (0-indexed)
            expect(result.getDate()).toBe(15);
        });

        it('should handle first day of year', () => {
            const result = parseLocalDateISO('2024-01-01');

            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(0);
            expect(result.getDate()).toBe(1);
        });

        it('should handle last day of year', () => {
            const result = parseLocalDateISO('2024-12-31');

            expect(result.getFullYear()).toBe(2024);
            expect(result.getMonth()).toBe(11);
            expect(result.getDate()).toBe(31);
        });

        it('should be inverse of getLocalDateISO', () => {
            const originalDate = '2024-06-15';
            const parsed = parseLocalDateISO(originalDate);
            const backToString = getLocalDateISO(parsed);

            expect(backToString).toBe(originalDate);
        });
    });
});
