


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
  badges: Badge[];
  xpLog: XpLogEntry[];
  weeklyRanking: WeeklyRankingData | null;
  newlyUnlockedBadgesQueue: Badge[];
  loading: boolean;
  
  // Actions
  fetchGamificationStats: (userId: string) => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchXpLog: (userId: string) => Promise<void>;
  fetchWeeklyRanking: (userId: string) => Promise<void>;
  logXpEvent: (event: XpLogEvent, meta: Record<string, any>, context: any) => Promise<void>;
  unlockBadges: (newlyUnlocked: Badge[]) => void;
  processNextBadgeInQueue: () => void;
  
  // Derived state/selectors can be added here if needed
  unlockedBadges: () => Badge[];
  xpForNextLevel: () => number;
  xpForCurrentLevel: () => number;
}

// Fórmula de cálculo de nível, conforme a documentação
const calculateLevel = (xp: number): number => {
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / 100, 0.6)) + 1;
};

const getXpForLevel = (level: number): number => {
    if (level <= 1) return 0;
    // Invertendo a fórmula: xp = 100 * (level - 1)^(1/0.6)
    return Math.ceil(100 * Math.pow(level - 1, 1 / 0.6));
};

const getEventMessage = (event: XpLogEvent): string => {
    switch (event) {
        // FIX: Changed 'estudo_concluido' to 'cronometro_finalizado' to match the XpLogEvent type.
        case 'cronometro_finalizado':
            return 'por concluir um estudo';
        case 'revisao_concluida':
            return 'por concluir uma revisão';
        case 'trilha_topico_concluido':
            return 'por concluir um tópico da trilha';
        case 'estudo_extra':
            return 'por um estudo extra';
        case 'revisao_atrasada':
            return 'por colocar uma revisão em dia';
        case 'meta_semanal_completa':
            return 'por completar sua meta semanal';
        case 'conquista_desbloqueada':
            return 'por uma nova conquista';
        default:
            return 'pela sua dedicação';
    }
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
    stats: null,
    badges: [],
    xpLog: [],
    weeklyRanking: null,
    newlyUnlockedBadgesQueue: [],
    loading: false,

    fetchGamificationStats: async (userId: string) => {
        set({ loading: true });
        try {
            const stats = await getGamificationStats(userId);
            if (stats) {
                // Recalcula o nível com base no XP total para garantir consistência
                stats.level = calculateLevel(stats.xp_total);
                set({ stats });
            }
        } catch (error) {
            console.error("Failed to fetch gamification stats:", error);
            toast.error("Não foi possível carregar seus dados de progresso.");
        } finally {
            set({ loading: false });
        }
    },

    fetchBadges: async () => {
        try {
            const badges = await getBadges();
            set({ badges });
        } catch (error) {
            console.error("Failed to fetch badges:", error);
            toast.error("Não foi possível carregar as conquistas.");
        }
    },
    
    fetchXpLog: async (userId: string) => {
        try {
            const xpLog = await getXpLog(userId);
            set({ xpLog });
        } catch (error) {
            console.error("Failed to fetch XP log:", error);
        }
    },

    fetchWeeklyRanking: async (userId: string) => {
        try {
            const rankingData = await getWeeklyRanking(userId);
            set({ weeklyRanking: rankingData });
        } catch (error) {
            console.error("Failed to fetch weekly ranking:", error);
            toast.error("Não foi possível carregar o ranking semanal.");
        }
    },

    logXpEvent: async (event, meta = {}, context: any) => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId) {
            console.error("User not authenticated, cannot log XP event.");
            return;
        }

        let amount = 10; // Default XP
        if (event === 'cronometro_finalizado' && context.durationMinutes) {
            amount = Math.max(10, Math.floor(context.durationMinutes / 10)); // 1 XP por 10 min, min 10
        }
        if (event === 'revisao_dificil') amount = 15;
        if (event === 'revisao_atrasada') amount = 5;

        toast.success(`+${amount} XP ${getEventMessage(event)}!`);

        try {
            // FIX: Added missing arguments 'tipo_evento' and 'multiplicador' to the logXpEventApi call to match its definition and prevent a runtime error.
            const tipo_evento = event === 'estudo_manual' ? 'manual' : 'ativo';
            const multiplicador = 1; // Default multiplier
            await logXpEventApi(userId, event, amount, meta, tipo_evento, multiplicador);
            
            await get().fetchGamificationStats(userId);
            await get().fetchXpLog(userId);

            checkAndAwardBadges();
            
        } catch (error) {
            console.error("Failed to log XP event:", error);
            toast.error("Erro ao registrar seu progresso de XP.");
        }
    },
    
    unlockBadges: (newlyUnlocked: Badge[]) => {
        const { stats } = get();
        if (!stats || newlyUnlocked.length === 0) return;

        const newBadgeIds = newlyUnlocked.map(b => b.id);
        const totalXpFromBadges = newlyUnlocked.reduce((acc, b) => acc + b.xp, 0);
        
        const previousLevel = calculateLevel(stats.xp_total);

        const updatedStats = {
          ...stats,
          unlockedBadgeIds: [...new Set([...stats.unlockedBadgeIds, ...newBadgeIds])],
          xp_total: stats.xp_total + totalXpFromBadges,
        };
        updatedStats.level = calculateLevel(updatedStats.xp_total);
        
        set(state => ({ 
            stats: updatedStats,
            newlyUnlockedBadgesQueue: [...state.newlyUnlockedBadgesQueue, ...newlyUnlocked]
        }));
        
        if (updatedStats.level > previousLevel) {
          toast.success(`🚀 Você subiu para o Nível ${updatedStats.level}!`);
        }

        updateGamificationStats(stats.user_id, { 
          xp_total: updatedStats.xp_total,
          unlockedBadgeIds: updatedStats.unlockedBadgeIds
        }).catch(err => {
          console.error("Failed to save unlocked badges:", err);
        });
    },

    processNextBadgeInQueue: () => {
        set(state => ({
            newlyUnlockedBadgesQueue: state.newlyUnlockedBadgesQueue.slice(1)
        }));
    },

    unlockedBadges: () => {
        const { stats, badges } = get();
        if (!stats?.unlockedBadgeIds || !badges) return [];
        const unlockedIds = new Set(stats.unlockedBadgeIds);
        return badges.filter(b => unlockedIds.has(b.id));
    },

    xpForNextLevel: () => {
        const level = get().stats?.level || 1;
        return getXpForLevel(level + 1);
    },
    
    xpForCurrentLevel: () => {
        const level = get().stats?.level || 1;
        return getXpForLevel(level);
    },
}));