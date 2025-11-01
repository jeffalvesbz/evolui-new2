



import { create } from 'zustand';
import { GamificationStats, XpLogEvent, Badge, XpLogEntry } from '../types';
import { getGamificationStats, logXpEvent as logXpEventApi, getBadges, getXpLog, updateGamificationStats, getWeeklyRanking } from '../services/geminiService';
import { useAuthStore } from './useAuthStore';
import { toast } from '../components/Sonner';
import { checkAndAwardBadges } from '../services/badgeService';

export type WeeklyRankingData = {
    ranking: { user_id: string; name: string; level: number; weekly_xp: number }[];
    currentUserRank: { user_id: string; name: string; level: number; weekly_xp: number; rank: number } | null;
}

interface GamificationState {
  stats: GamificationStats | null;
