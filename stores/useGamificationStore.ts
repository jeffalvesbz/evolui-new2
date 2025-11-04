
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
        const userId = useAuthStore.getState().user?.id;
        const { stats, fetchXpLog, fetchGamificationStats } = get();
        if (!stats || newlyUnlocked.length === 0 || !userId) return;

        // 1. Adiciona as conquistas à fila de notificações da UI
        set(state => ({ 
            newlyUnlockedBadgesQueue: [...state.newlyUnlockedBadgesQueue, ...newlyUnlocked]
        }));
        
        // 2. Atualiza o estado local de forma otimista para feedback imediato na UI
        const newBadgeIds = newlyUnlocked.map(b => b.id);
        const totalXpFromBadges = newlyUnlocked.reduce((acc, b) => acc + (b.xp || 0), 0);
        
        const oldLevel = stats.level;
        
        const updatedStats = {
            ...stats,
            unlockedBadgeIds: [...new Set([...stats.unlockedBadgeIds, ...newBadgeIds])],
            xp_total: stats.xp_total + totalXpFromBadges,
        };
        updatedStats.level = calculateLevel(updatedStats.xp_total);
        
        set({ stats: updatedStats });
        
        if (updatedStats.level > oldLevel) {
            toast.success(`🚀 Você subiu para o Nível ${updatedStats.level}!`);
        }

        // 3. Persiste a lista de conquistas atualizada e registra os eventos de XP no backend
        updateGamificationStats(userId, { 
          unlockedBadgeIds: updatedStats.unlockedBadgeIds
        }).then(() => {
            // Após salvar a lista de conquistas, registra o XP de cada uma
            const logPromises = newlyUnlocked.map(badge => {
                if (badge.xp && badge.xp > 0) {
                    toast.success(`+${badge.xp} XP pela conquista "${badge.name}"!`);
                    return logXpEventApi(
                        userId,
                        'conquista_desbloqueada', 
                        badge.xp, 
                        { badgeId: badge.id, badgeName: badge.name }, 
                        'manual', 
                        1
                    );
                }
                return Promise.resolve(null);
            });

            // Após todos os logs, atualiza o feed de atividades
            Promise.all(logPromises).then(() => {
                fetchXpLog(userId);
            });

        }).catch(err => {
          console.error("Failed to save unlocked badges:", err);
          toast.error("Erro ao salvar suas novas conquistas.");
          // Em caso de falha, resgata o estado do servidor para reverter a mudança otimista
          fetchGamificationStats(userId);
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
