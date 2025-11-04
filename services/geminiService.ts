

import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, XpLogEvent, XpLogEntry, GamificationStats, DisciplinaParaIA, Friendship, FriendRequest, NivelDificuldade } from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';
import { Simulation } from '../stores/useStudyStore';
import { subDays } from 'date-fns';
import { WeeklyRankingData } from '../stores/useGamificationStore';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper para obter o user_id ---
const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user.id) throw new Error("Usuário не autenticado.");
    return data.session.user.id;
}

// --- Helper para calcular nível ---
const calculateLevel = (xp: number): number => {
    if (xp <= 0) return 1;
    return Math.floor(Math.pow(xp / 100, 0.6)) + 1;
};


// --- AUTH SERVICE ---
export const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
};

export const signup = async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
            }
        }
    });
    if (error) throw error;
}


// --- AI PROXY SERVICES (Estes não mudam, pois já usam a API Gemini real) ---
export const generateFlashcards = async (topicName: string): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
  // Simulação, pois não temos um backend para o proxy. Em um app real, isso seria uma chamada fetch.
  return [{ pergunta: `Qual a capital do Brasil para o tópico ${topicName}?`, resposta: 'Brasília.' }];
};

export const generateFlashcardsFromContent = async (disciplinaId: string): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
    await new Promise(res => setTimeout(res, 1500)); // Simulate AI thinking
    return [
        { pergunta: 'O que é Inquérito Policial?', resposta: 'Procedimento administrativo e investigatório, não-processual, presidido pela autoridade policial.', estilo: 'direto'},
        { pergunta: 'Explique o princípio da insignificância no Direito Penal.', resposta: 'Causa de exclusão da tipicidade material do fato, aplicável quando a lesão ao bem jurídico tutelado é ínfima.', estilo: 'explicativo' },
        { pergunta: 'O habeas corpus pode ser impetrado por ______.', resposta: 'qualquer pessoa', estilo: 'completar' },
    ];
};

export const suggestTopics = async (comment: string): Promise<string[]> => {
  return ['Tópico Sugerido 1', 'Tópico Sugerido 2'];
};

const correcaoSchema = {
    type: Type.OBJECT,
    properties: {
        banca: { type: Type.STRING }, notaMaxima: { type: Type.NUMBER },
        avaliacaoDetalhada: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { criterio: { type: Type.STRING }, pontuacao: { type: Type.NUMBER }, maximo: { type: Type.NUMBER }, feedback: { type: Type.STRING } } } },
        comentariosGerais: { type: Type.STRING }, notaFinal: { type: Type.NUMBER },
        errosDetalhados: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trecho: { type: Type.STRING }, tipo: { type: Type.STRING }, explicacao: { type: Type.STRING }, sugestao: { type: Type.STRING } } } }
    }
};

export const corrigirRedacao = async (redacao: string, banca: string, notaMaxima: number, tema?: string): Promise<CorrecaoCompleta> => {
    const prompt = `Corrija a redação a seguir para a banca "${banca}" com nota máxima ${notaMaxima} e tema "${tema || 'Não especificado'}":\n\n${redacao}\n\nRetorne JSON.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-pro', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: correcaoSchema } });
    let jsonText = response.text.trim().replace(/^```json\n?|```$/g, '');
    return JSON.parse(jsonText) as CorrecaoCompleta;
};

export const extrairTextoDeImagem = async (base64Image: string, mimeType: string): Promise<string> => {
    const imagePart = { inlineData: { mimeType, data: base64Image } };
    const textPart = { text: "Transcreva o texto contido nesta imagem." };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [imagePart, textPart] } });
    return response.text;
};

export const gerarPlanoDeEstudosIA = async (objetivo: string, horasSemanais: number, disciplinasComTopicos: DisciplinaParaIA[]): Promise<TrilhaSemanalData> => {
     // Esta lógica pode ser mais complexa, mas aqui está uma simulação.
    const allTopicIds = disciplinasComTopicos.flatMap(d => d.topicos.map(t => t.id));
    const mockPlan: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
    const dias = ['seg', 'ter', 'qua', 'qui', 'sex'];
    allTopicIds.sort(() => 0.5 - Math.random()).forEach((topicId, index) => {
        mockPlan[dias[index % dias.length]].push(topicId);
    });
    await new Promise(res => setTimeout(res, 1500));
    return mockPlan;
};

export const sugerirCicloIA = async (disciplinas: { id: string, nome: string, dificuldade: string }[], tempoTotalMinutos: number): Promise<{disciplina_id: string, tempo_previsto: number}[]> => {
    const prompt = `Crie uma sugestão de ciclo de estudos com ${tempoTotalMinutos} minutos totais para as matérias: ${disciplinas.map(d => `${d.nome} (dificuldade: ${d.dificuldade})`).join(', ')}. Retorne um array JSON com "disciplina_id" e "tempo_previsto" em minutos.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { disciplina_id: { type: Type.STRING }, tempo_previsto: { type: Type.NUMBER } } } };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema } });
    let jsonText = response.text.trim().replace(/^```json\n?|```$/g, '');
    const sugestao = JSON.parse(jsonText) as {disciplina_id: string, tempo_previsto: number}[];
    return sugestao.map(s => ({ ...s, tempo_previsto: s.tempo_previsto * 60 }));
};

export const gerarMensagemMotivacionalIA = async (userName: string, tempoHojeMin: number, metaPercentual: number, streakDays: number, revisoesPendentes: number): Promise<string> => {
    const prompt = `Crie uma mensagem motivacional curta para ${userName} que estudou ${tempoHojeMin} min hoje (${metaPercentual}% da meta), tem ${streakDays} dias de streak e ${revisoesPendentes} revisões pendentes.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text.trim();
};


// --- GAMIFICATION SERVICES ---
export const getGamificationStats = async (userId: string): Promise<GamificationStats | null> => {
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('xp_total, current_streak_days, best_streak_days').eq('user_id', userId).single<any>();
    if (profileError && profileError.code !== 'PGRST116') throw profileError;

    // FIX: Cast data to any to bypass 'never' type issue.
    const { data: badgesData, error: badgesError } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
    if (badgesError) throw badgesError;

    if (!profileData) return null;

    return {
        user_id: userId,
        xp_total: profileData.xp_total,
        current_streak_days: profileData.current_streak_days,
        best_streak_days: profileData.best_streak_days,
        unlockedBadgeIds: (badgesData as any[]).map(b => b.badge_id),
        level: 0 // O nível é calculado no store
    };
};

export const updateGamificationStats = async (userId: string, statsUpdates: Partial<GamificationStats>) => {
    // FIX: Exclude the 'level' property as it is not part of the 'profiles' table.
    const { unlockedBadgeIds, level, ...profileUpdates } = statsUpdates;

    if (Object.keys(profileUpdates).length > 0) {
        // FIX: Cast data to any to bypass 'never' type issue.
        const { error: profileError } = await supabase.from('profiles').update(profileUpdates as any).eq('user_id', userId);
        if (profileError) throw profileError;
    }

    if (unlockedBadgeIds) {
        const { data: existingBadges, error: getError } = await supabase
            .from('user_badges')
            .select('badge_id')
            .eq('user_id', userId);
        if (getError) throw getError;

        const existingBadgeIds = new Set((existingBadges as any[]).map(b => b.badge_id));
        const newBadgesToInsert = unlockedBadgeIds
            .filter(id => !existingBadgeIds.has(id))
            .map(badge_id => ({ user_id: userId, badge_id }));

        if (newBadgesToInsert.length > 0) {
            // FIX: Cast data to any to bypass 'never' type issue.
            const { error: insertError } = await supabase.from('user_badges').insert(newBadgesToInsert as any);
            if (insertError) throw insertError;
        }
    }
    
    return getGamificationStats(userId);
};

// ✅ Corrigido: Assinatura da função alinhada com a tabela `xp_log` do SQL (sem `tipo_evento` ou `multiplicador`).
export const logXpEvent = async (userId: string, event: XpLogEvent, amount: number, meta: Record<string, any> = {}) => {
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data: logData, error: logError } = await supabase.from('xp_log').insert({ user_id: userId, event, amount, meta_json: meta } as any).select().single();
    if (logError) throw logError;

    // A database function/trigger would be better here, but for now we update manually.
    const { data: profile, error: fetchError } = await supabase.from('profiles').select('xp_total').eq('user_id', userId).single<any>();
    if (fetchError) throw fetchError;
    
    const newXpTotal = (profile?.xp_total || 0) + amount;
    // FIX: Cast data to any to bypass 'never' type issue.
    const { error: updateError } = await supabase.from('profiles').update({ xp_total: newXpTotal } as any).eq('user_id', userId);
    if (updateError) throw updateError;

    return logData;
};

export const getBadges = async () => {
    const { data, error } = await supabase.from('badges').select('*');
    if (error) throw error;
    return data;
};
export const getXpLog = async (userId: string) => {
    const { data, error } = await supabase.from('xp_log').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

// Helper function to reduce code duplication between global and friends ranking
const _getRankingForUserIds = async (userIds: string[], currentUserId: string): Promise<WeeklyRankingData> => {
    if (userIds.length === 0) {
        return { ranking: [], currentUserRank: null };
    }
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const { data: xpLogsData, error: logError } = await supabase
        .from('xp_log')
        .select('user_id, amount')
        .in('user_id', userIds)
        .gte('created_at', sevenDaysAgo);
    
    if (logError) throw logError;
    const xpLogs = (xpLogsData || []) as any[];

    const weeklyXpMap = new Map<string, number>();
    for (const log of xpLogs) {
        weeklyXpMap.set(log.user_id, (weeklyXpMap.get(log.user_id) || 0) + log.amount);
    }
    
    const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, name, xp_total')
        .in('user_id', userIds);
        
    if (profileError) throw profileError;
    const profiles = (profilesData || []) as any[];

    const fullRanking = profiles.map(p => ({
        user_id: p.user_id,
        name: p.name,
        level: calculateLevel(p.xp_total),
        weekly_xp: weeklyXpMap.get(p.user_id) || 0,
    })).sort((a, b) => b.weekly_xp - a.weekly_xp);
    
    const currentUserIndex = fullRanking.findIndex(u => u.user_id === currentUserId);
    const currentUserRank = currentUserIndex !== -1 
        ? { ...fullRanking[currentUserIndex], rank: currentUserIndex + 1 } 
        : null;

    return {
        ranking: fullRanking,
        currentUserRank,
    };
};

export const getWeeklyRanking = async (userId: string): Promise<WeeklyRankingData> => {
    const sevenDaysAgo = subDays(new Date(), 7).toISOString();

    const { data: xpLogsData, error: logError } = await supabase
        .from('xp_log')
        .select('user_id, amount')
        .gte('created_at', sevenDaysAgo);
    
    if (logError) throw logError;
    const xpLogs = (xpLogsData || []) as any[];

    const weeklyXpMap = new Map<string, number>();
    for (const log of xpLogs) {
        weeklyXpMap.set(log.user_id, (weeklyXpMap.get(log.user_id) || 0) + log.amount);
    }
    
    const userIdsInRanking = new Set(weeklyXpMap.keys());
    userIdsInRanking.add(userId); // Ensure current user is always included
    
    const userIdsArray = Array.from(userIdsInRanking);

    if (userIdsArray.length === 0) {
        return { ranking: [], currentUserRank: null };
    }
    
    const rankingData = await _getRankingForUserIds(userIdsArray, userId);

    return {
        ...rankingData,
        ranking: rankingData.ranking.slice(0, 50), // Slice for global ranking
    };
};


// --- DATA SERVICES ---

// StudyPlans (Editais)
export const getStudyPlans = async () => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('study_plans').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
};
export const createStudyPlan = async (studyPlanData: Omit<StudyPlan, 'id'>) => {
    const userId = await getUserId();
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('study_plans').insert({ ...studyPlanData, user_id: userId } as any).select().single();
    if (error) throw error;
    return data;
};
export const updateStudyPlanApi = async (id: string, updates: Partial<StudyPlan>) => {
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('study_plans').update(updates as any).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteStudyPlan = async (id: string) => {
    const { error } = await supabase.from('study_plans').delete().eq('id', id);
    if (error) throw error;
};

// Disciplinas (with nested topicos)
// ✅ Corrigido: Parâmetro renomeado de `editalId` para `studyPlanId` para consistência.
export const getDisciplinas = async (studyPlanId: string): Promise<Disciplina[]> => {
    const { data, error } = await supabase
        .from('disciplinas')
        .select('*, topicos(*)')
        .eq('study_plan_id', studyPlanId);
    if (error) throw error;
    
    // Manual mapping to fix snake_case from DB to camelCase for the app
    const disciplinesWithMappedTopics = data.map((d: any) => {
        if (!d.topicos) {
            return d;
        }
        const mappedTopics = d.topicos.map((t: any) => {
            const { nivel_dificuldade, ultima_revisao, proxima_revisao, ...rest } = t;
            return { 
                ...rest, 
                nivelDificuldade: nivel_dificuldade,
                ultimaRevisao: ultima_revisao,
                proximaRevisao: proxima_revisao,
            };
        });
        return { ...d, topicos: mappedTopics };
    });

    return disciplinesWithMappedTopics as any as Disciplina[];
};
// ✅ Corrigido: Parâmetro renomeado de `editalId` para `studyPlanId` para consistência.
export const createDisciplina = async (studyPlanId: string, disciplinaData: Omit<Disciplina, 'id' | 'progresso' | 'studyPlanId'>) => {
    const userId = await getUserId();
    // Topicos are managed separately now
    const { topicos, ...rest } = disciplinaData;
    const payload = { ...rest, study_plan_id: studyPlanId, progresso: 0, user_id: userId };
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('disciplinas').insert(payload as any).select().single();
    if (error) throw error;
    // FIX: Cast data to any to allow spread.
    return { ...(data as any), topicos: [] }; // Return with empty topics array
};
export const updateDisciplinaApi = async (id: string, updates: Partial<Disciplina>) => {
    // We only update disciplina's own fields here. Topics are handled by their own functions.
    const { topicos, ...disciplinaUpdates } = updates;
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('disciplinas').update(disciplinaUpdates as any).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteDisciplina = async (id: string) => {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) throw error;
};

// Tópicos (separate table)
export const createTopico = async (disciplinaId: string, topicoData: Omit<Topico, 'id'>): Promise<Topico> => {
    const userId = await getUserId();
    const { nivelDificuldade, ultimaRevisao, proximaRevisao, ...rest } = topicoData;
    const payload = { 
        ...rest, 
        disciplina_id: disciplinaId, 
        user_id: userId,
        nivel_dificuldade: nivelDificuldade,
        ultima_revisao: ultimaRevisao,
        proxima_revisao: proximaRevisao,
    };
    
    // FIX: Cast payload to 'any' to resolve Supabase client 'never' type error.
    const { data, error } = await supabase.from('topicos').insert(payload as any).select().single();

    if (error) {
        console.error("Failed to add topico:", error);
        throw error;
    }
    if (!data) throw new Error("Failed to create topic, no data returned.");
    
    // FIX: Cast data to 'any' to allow destructuring with rest operator, which fails on the inferred 'never' type.
    const { nivel_dificuldade, ultima_revisao, proxima_revisao, ...returnData } = data as any;
    return { 
        ...returnData, 
        nivelDificuldade: nivel_dificuldade,
        ultimaRevisao: ultima_revisao,
        proximaRevisao: proxima_revisao,
    } as Topico;
};
export const updateTopicoApi = async (topicoId: string, updates: Partial<Topico>): Promise<Topico> => {
    const { nivelDificuldade, ultimaRevisao, proximaRevisao, ...restOfUpdates } = updates;
    const payload: { [key: string]: any } = { ...restOfUpdates };
    
    if (nivelDificuldade !== undefined) {
        payload.nivel_dificuldade = nivelDificuldade;
    }
    if (ultimaRevisao !== undefined) {
        payload.ultima_revisao = ultimaRevisao;
    }
    if (proximaRevisao !== undefined) {
        payload.proxima_revisao = proximaRevisao;
    }

    // FIX: Cast payload to 'any' to resolve Supabase client 'never' type error.
    const { data, error } = await supabase.from('topicos').update(payload as any).eq('id', topicoId).select().single();
     
    if (error) {
        console.error("Failed to update topico:", error);
        throw error;
    }
    if (!data) throw new Error("Failed to update topic, no data returned.");
     
     // FIX: Cast data to 'any' to allow destructuring with rest operator, which fails on the inferred 'never' type.
     const { nivel_dificuldade, ultima_revisao, proxima_revisao, ...restOfData } = data as any;
     return { 
         ...restOfData, 
         nivelDificuldade: nivel_dificuldade,
         ultimaRevisao: ultima_revisao,
         proximaRevisao: proxima_revisao,
    } as Topico;
};
export const deleteTopico = async (id: string) => {
    const { error } = await supabase.from('topicos').delete().eq('id', id);
    if (error) throw error;
};

// --- Custom CRUD for SessaoEstudo ---
const mapSessaoToDb = (sessaoData: Partial<SessaoEstudo>) => {
    // No camelCase fields in SessaoEstudo other than studyPlanId, which is handled separately.
    const { studyPlanId, ...rest } = sessaoData;
    return rest;
};

const mapDbToSessao = (dbData: any): SessaoEstudo => {
    const { study_plan_id, ...rest } = dbData;
    return { ...rest, studyPlanId: study_plan_id } as SessaoEstudo;
};

export const getSessoes = async (studyPlanId: string): Promise<SessaoEstudo[]> => {
    const { data, error } = await supabase.from('sessoes_estudo').select('*').eq('study_plan_id', studyPlanId);
    if (error) throw error;
    return (data as any[]).map(mapDbToSessao);
};
export const createSessao = async (studyPlanId: string, itemData: Omit<SessaoEstudo, 'id' | 'studyPlanId'>): Promise<SessaoEstudo> => {
    const userId = await getUserId();
    const payload = { ...itemData, study_plan_id: studyPlanId, user_id: userId };
    const { data, error } = await supabase.from('sessoes_estudo').insert(payload as any).select().single();
    if (error) throw error;
    return mapDbToSessao(data);
};
export const updateSessaoApi = async (id: string, updates: Partial<Omit<SessaoEstudo, 'id'>>): Promise<SessaoEstudo> => {
    const payload = mapSessaoToDb(updates);
    const { data, error } = await supabase.from('sessoes_estudo').update(payload as any).eq('id', id).select().single();
    if (error) throw error;
    return mapDbToSessao(data);
};
export const deleteSessao = async (id: string) => {
    const { error } = await supabase.from('sessoes_estudo').delete().eq('id', id);
    if (error) throw error;
};

// --- Custom CRUD for RedacaoCorrigida ---
const mapRedacaoToDb = (redacaoData: Partial<RedacaoCorrigida>) => {
    const { studyPlanId, notaMaxima, ...rest } = redacaoData;
    const dbPayload: any = { ...rest };
    if (notaMaxima !== undefined) dbPayload.nota_maxima = notaMaxima;
    return dbPayload;
};

const mapDbToRedacao = (dbData: any): RedacaoCorrigida => {
    const { study_plan_id, nota_maxima, ...rest } = dbData;
    return { ...rest, studyPlanId: study_plan_id, notaMaxima: nota_maxima } as RedacaoCorrigida;
};

export const getRedacoes = async (studyPlanId: string): Promise<RedacaoCorrigida[]> => {
    const { data, error } = await supabase.from('redacoes_corrigidas').select('*').eq('study_plan_id', studyPlanId);
    if (error) throw error;
    return (data as any[]).map(mapDbToRedacao);
};
export const createRedacao = async (studyPlanId: string, itemData: Omit<RedacaoCorrigida, 'id' | 'studyPlanId'>): Promise<RedacaoCorrigida> => {
    const userId = await getUserId();
    const dbPayload = mapRedacaoToDb(itemData);
    const payload = { ...dbPayload, study_plan_id: studyPlanId, user_id: userId };
    const { data, error } = await supabase.from('redacoes_corrigidas').insert(payload as any).select().single();
    if (error) throw error;
    return mapDbToRedacao(data);
};

// --- Custom CRUD for Simulados ---
const mapSimuladoToDb = (simuladoData: Partial<Simulation>) => {
    const { durationMinutes, isCebraspe, studyPlanId, ...rest } = simuladoData;
    const dbPayload: any = { ...rest };
    if (durationMinutes !== undefined) dbPayload.duration_minutes = durationMinutes;
    if (isCebraspe !== undefined) dbPayload.is_cebraspe = isCebraspe;
    // studyPlanId is handled by the create function parameter, not in the payload object
    return dbPayload;
};

const mapDbToSimulado = (dbData: any): Simulation => {
    const { duration_minutes, is_cebraspe, study_plan_id, ...rest } = dbData;
    return {
        ...rest,
        durationMinutes: duration_minutes,
        isCebraspe: is_cebraspe,
        studyPlanId: study_plan_id,
    } as Simulation;
};

export const getSimulados = async (studyPlanId: string): Promise<Simulation[]> => {
    const { data, error } = await supabase
        .from('simulados')
        .select('*')
        .eq('study_plan_id', studyPlanId);
    if (error) throw error;
    return (data as any[]).map(mapDbToSimulado);
};

export const createSimulado = async (studyPlanId: string, simuladoData: Omit<Simulation, 'id' | 'studyPlanId'>): Promise<Simulation> => {
    const userId = await getUserId();
    const dbPayload = mapSimuladoToDb(simuladoData);
    dbPayload.study_plan_id = studyPlanId;
    dbPayload.user_id = userId;

    const { data, error } = await supabase.from('simulados').insert(dbPayload as any).select().single();
    if (error) throw error;
    return mapDbToSimulado(data);
};

export const updateSimuladoApi = async (id: string, updates: Partial<Omit<Simulation, 'id'>>): Promise<Simulation> => {
    const dbPayload = mapSimuladoToDb(updates);
    const { data, error } = await supabase.from('simulados').update(dbPayload as any).eq('id', id).select().single();
    if (error) throw error;
    return mapDbToSimulado(data);
};

export const deleteSimulado = async (id: string) => {
    const { error } = await supabase.from('simulados').delete().eq('id', id);
    if (error) throw error;
};


// --- Custom CRUD for Revisoes to fix schema mismatch ---
const mapRevisaoToDb = (revisaoData: Partial<Revisao>) => {
    const { disciplinaId, ...rest } = revisaoData;
    const dbPayload: any = { ...rest };
    if (disciplinaId !== undefined) {
        dbPayload.disciplina_id = disciplinaId;
    }
    // The other fields like topico_id, data_prevista are already snake_case in the Revisao type
    return dbPayload;
};

const mapDbToRevisao = (dbData: any): Revisao => {
    const { disciplina_id, ...rest } = dbData;
    return {
        ...rest,
        disciplinaId: disciplina_id,
    } as Revisao;
};

export const getRevisoes = async (studyPlanId: string): Promise<Revisao[]> => {
    const { data, error } = await supabase
        .from('revisoes')
        .select('*')
        .eq('study_plan_id', studyPlanId);
    if (error) throw error;
    // FIX: Type 'never' cannot be mapped. Cast to any[] first.
    return (data as any[]).map(mapDbToRevisao);
};

export const createRevisao = async (studyPlanId: string, revisaoData: Omit<Revisao, 'id' | 'studyPlanId'>): Promise<Revisao> => {
    const userId = await getUserId();
    const dbPayload = mapRevisaoToDb(revisaoData);
    dbPayload.study_plan_id = studyPlanId;
    dbPayload.user_id = userId;

    const { data, error } = await supabase.from('revisoes').insert(dbPayload).select().single();
    if (error) {
        console.error("Failed to create revisao:", error);
        throw error;
    }
    return mapDbToRevisao(data);
};

export const updateRevisaoApi = async (id: string, updates: Partial<Omit<Revisao, 'id'>>): Promise<Revisao> => {
    const dbPayload = mapRevisaoToDb(updates);

    const { data, error } = await supabase.from('revisoes').update(dbPayload).eq('id', id).select().single();
    if (error) {
        console.error("Failed to update revisao:", error);
        throw error;
    }
    return mapDbToRevisao(data);
};

export const deleteRevisao = async (id: string) => {
    const { error } = await supabase.from('revisoes').delete().eq('id', id);
    if (error) throw error;
};


// --- Custom CRUD for Caderno de Erros to fix schema mismatch ---
const mapCadernoErroToDb = (erroData: Partial<CadernoErro>) => {
    const dbPayload: any = {};
    if (erroData.assunto !== undefined) dbPayload.assunto = erroData.assunto;
    if (erroData.descricao !== undefined) dbPayload.descricao = erroData.descricao;
    if (erroData.resolvido !== undefined) dbPayload.resolvido = erroData.resolvido;
    if (erroData.data !== undefined) dbPayload.data = erroData.data;
    if (erroData.observacoes !== undefined) dbPayload.observacoes = erroData.observacoes;
    if (erroData.disciplinaId !== undefined) dbPayload.disciplina_id = erroData.disciplinaId;
    if (erroData.topicoId !== undefined) dbPayload.topico_id = erroData.topicoId;
    return dbPayload;
};

export const getErros = async (studyPlanId: string): Promise<CadernoErro[]> => {
    const { data, error } = await supabase
        .from('caderno_erros')
        .select('*, disciplina:disciplinas(nome), topico:topicos(titulo)')
        .eq('study_plan_id', studyPlanId);
    
    if (error) throw error;

    return (data as any[]).map((e: any) => ({
        ...e,
        disciplina: e.disciplina?.nome || 'Disciplina Desconhecida',
        disciplinaId: e.disciplina_id,
        topicoId: e.topico_id,
        topicoTitulo: e.topico?.titulo || ''
    })) as CadernoErro[];
};

export const createErro = async (studyPlanId: string, erroData: Omit<CadernoErro, 'id' | 'studyPlanId'>): Promise<CadernoErro> => {
    const userId = await getUserId();
    const dbPayload = mapCadernoErroToDb(erroData);
    
    dbPayload.study_plan_id = studyPlanId;
    dbPayload.user_id = userId;

    if (!dbPayload.disciplina_id) {
        throw new Error("disciplinaId is required to create an error entry.");
    }

    const { data, error } = await supabase.from('caderno_erros').insert(dbPayload).select().single();
    
    if (error) {
        console.error("Failed to add erro:", error);
        throw error;
    }
    
    return {
        ...(data as any),
        ...erroData,
        disciplina: erroData.disciplina,
        disciplinaId: data.disciplina_id,
        topicoId: data.topico_id,
        topicoTitulo: erroData.topicoTitulo,
    } as CadernoErro;
};

export const updateErroApi = async (id: string, updates: Partial<Omit<CadernoErro, 'id'>>): Promise<CadernoErro> => {
    const dbPayload = mapCadernoErroToDb(updates);

    const { data, error } = await supabase.from('caderno_erros').update(dbPayload).eq('id', id).select('*, disciplina:disciplinas(nome), topico:topicos(titulo)').single();
    if (error) {
        console.error("Failed to update erro:", error);
        throw error;
    }
    
    const { disciplina, topico, disciplina_id, topico_id, ...rest } = data as any;

    return {
        ...rest,
        ...updates,
        disciplina: disciplina?.nome || updates.disciplina || 'Disciplina Desconhecida',
        disciplinaId: disciplina_id,
        topicoId: topico_id,
        topicoTitulo: topico?.titulo || updates.topicoTitulo || '',
    } as CadernoErro;
};

export const deleteErro = async (id: string) => {
    const { error } = await supabase.from('caderno_erros').delete().eq('id', id);
    if (error) throw error;
};


// ✅ Corrigido: Funções CRUD para Ciclos movidas para implementações customizadas para lidar com a relação com `sessoes_ciclo`.
export const getCiclos = async (studyPlanId: string): Promise<Ciclo[]> => {
    const { data, error } = await supabase
        .from('ciclos')
        .select('*, sessoes_ciclo(*)')
        .eq('study_plan_id', studyPlanId);

    if (error) throw error;
    
    return (data || []).map((ciclo: any) => ({
        ...ciclo,
        sessoes: (ciclo.sessoes_ciclo || []).sort((a: any, b: any) => a.ordem - b.ordem)
    })) as any as Ciclo[];
};

export const createCiclo = async (studyPlanId: string, cicloData: Omit<Ciclo, 'id' | 'studyPlanId'>): Promise<Ciclo> => {
    const userId = await getUserId();
    const { sessoes, ...cicloInfo } = cicloData;

    const { data: ciclo, error: cicloError } = await supabase
        .from('ciclos')
        .insert({ ...cicloInfo, user_id: userId, study_plan_id: studyPlanId } as any)
        .select()
        .single();
    if (cicloError) throw cicloError;

    if (sessoes && sessoes.length > 0) {
        const sessoesToInsert = sessoes.map(s => ({
            disciplina_id: s.disciplina_id,
            ordem: s.ordem,
            tempo_previsto: s.tempo_previsto,
            user_id: userId,
            ciclo_id: ciclo.id,
        }));
        const { data: insertedSessoes, error: sessoesError } = await supabase
            .from('sessoes_ciclo')
            .insert(sessoesToInsert as any)
            .select();
        if (sessoesError) throw sessoesError;
        return { ...ciclo, sessoes: (insertedSessoes || []).sort((a: any, b: any) => a.ordem - b.ordem) } as any as Ciclo;
    }
    
    return { ...ciclo, sessoes: [] } as any as Ciclo;
};

export const updateCicloApi = async (id: string, updates: Partial<Omit<Ciclo, 'id'>>): Promise<Ciclo> => {
    const userId = await getUserId();
    const { sessoes, ...cicloInfo } = updates;

    if (Object.keys(cicloInfo).length > 0) {
        const { error: cicloError } = await supabase
            .from('ciclos')
            .update(cicloInfo as any)
            .eq('id', id);
        if (cicloError) throw cicloError;
    }

    if (sessoes) {
        await supabase.from('sessoes_ciclo').delete().eq('ciclo_id', id);
        
        if (sessoes.length > 0) {
             const sessoesToInsert = sessoes.map(s => ({
                disciplina_id: s.disciplina_id,
                ordem: s.ordem,
                tempo_previsto: s.tempo_previsto,
                user_id: userId,
                ciclo_id: id,
            }));
             await supabase.from('sessoes_ciclo').insert(sessoesToInsert as any);
        }
    }
    
    const { data: updatedCiclo, error: fetchError } = await supabase
        .from('ciclos')
        .select('*, sessoes_ciclo(*)')
        .eq('id', id)
        .single();

    if (fetchError) throw fetchError;
    
    return {
        ...updatedCiclo,
        sessoes: (updatedCiclo.sessoes_ciclo || []).sort((a: any, b: any) => a.ordem - b.ordem)
    } as any as Ciclo;
};

export const deleteCiclo = async (id: string) => {
    // A FK em `sessoes_ciclo` не tem `ON DELETE CASCADE` no schema, então deletamos manualmente.
    await supabase.from('sessoes_ciclo').delete().eq('ciclo_id', id);
    const { error } = await supabase.from('ciclos').delete().eq('id', id);
    if (error) throw error;
};

// --- Custom CRUD for Flashcards ---
const mapDbToFlashcard = (dbData: any): Flashcard => {
    const { due_date, ease_factor, ...rest } = dbData;
    return {
        ...rest,
        dueDate: due_date,
        easeFactor: ease_factor,
    } as Flashcard;
};

const mapFlashcardToDb = (flashcardData: Partial<Flashcard>) => {
    const { dueDate, easeFactor, ...rest } = flashcardData;
    const dbPayload: any = { ...rest };
    if (dueDate !== undefined) dbPayload.due_date = dueDate;
    if (easeFactor !== undefined) dbPayload.ease_factor = easeFactor;
    return dbPayload;
};


// Note: Flashcards are linked to topics, not study plans directly.
export const getFlashcards = async (topicId: string): Promise<Flashcard[]> => {
    const { data, error } = await supabase.from('flashcards').select('*').eq('topico_id', topicId);
    if (error) throw error;
    return (data as any[]).map(mapDbToFlashcard);
};
export const createFlashcards = async (topicId: string, { flashcards }: { flashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[] }): Promise<Flashcard[]> => {
    const userId = await getUserId();
    const flashcardsToInsert = flashcards.map(fc => ({
        ...fc,
        topico_id: topicId,
        user_id: userId,
        interval: 1,
        ease_factor: 2.5,
        due_date: new Date().toISOString(),
    }));
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('flashcards').insert(flashcardsToInsert as any).select();
    if (error) throw error;
    return (data as any[]).map(mapDbToFlashcard);
};
export const updateFlashcardApi = async (id: string, updates: Partial<Flashcard>): Promise<Flashcard> => {
    const dbPayload = mapFlashcardToDb(updates);
    const { data, error } = await supabase.from('flashcards').update(dbPayload).eq('id', id).select().single();
    if (error) throw error;
    return mapDbToFlashcard(data);
};
export const deleteFlashcard = async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) throw error;
};


// --- FRIENDS SERVICES (Social) ---
export const getFriends = async (userId: string): Promise<User[]> => {
    const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .eq('status', 'accepted');

    if (friendshipsError) throw friendshipsError;
    const friendships = (friendshipsData || []) as any[];

    if (friendships.length === 0) return [];
    const friendIds = friendships.map(f => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);

    const { data: friendsProfileData, error: friendsError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .in('user_id', friendIds);
    
    if (friendsError) throw friendsError;
    const friendsData = (friendsProfileData || []) as any[];

    return friendsData.map(p => ({
        id: p.user_id,
        name: p.name,
        email: p.email,
    }));
};

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
    const { data: requestsData, error: requestsError } = await supabase
        .from('friendships')
        .select('id, user_id_1')
        .eq('user_id_2', userId)
        .eq('status', 'pending');

    if (requestsError) throw requestsError;
    const requests = (requestsData || []) as any[];
    if (requests.length === 0) return [];

    const requesterIds = requests.map(r => r.user_id_1);

    const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, xp_total')
        .in('user_id', requesterIds);

    if (profilesError) throw profilesError;
    const profiles = (profilesData || []) as any[];
    
    const profilesMap = new Map(profiles.map(p => [p.user_id, p]));

    return requests.map(req => {
        const profile = profilesMap.get(req.user_id_1);
        return {
            friendship_id: req.id,
            requester_id: req.user_id_1,
            requester_name: profile?.name || 'Usuário desconhecido',
            requester_level: profile ? calculateLevel(profile.xp_total) : 1,
        };
    });
};

export const searchUsers = async (query: string, currentUserId: string): Promise<User[]> => {
    const { data: relData, error: relError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

    if (relError) throw relError;
    const relationships = (relData || []) as any[];

    const existingRelationshipIds = new Set(
        relationships.flatMap(r => [r.user_id_1, r.user_id_2])
    );
    existingRelationshipIds.add(currentUserId);

    const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, name, email')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .not('user_id', 'in', `(${Array.from(existingRelationshipIds).map(id => `'${id}'`).join(',')})`)
        .limit(10);
        
    if (usersError) throw usersError;
    const users = (usersData || []) as any[];

    return users.map(p => ({
        id: p.user_id,
        name: p.name,
        email: p.email,
    }));
};

export const sendFriendRequest = async (requesterId: string, receiverId: string) => {
    const { data: existingData, error: checkError } = await supabase
        .from('friendships')
        .select('id')
        .or(`(user_id_1.eq.${requesterId},user_id_2.eq.${receiverId}),(user_id_1.eq.${receiverId},user_id_2.eq.${requesterId})`)
        .limit(1);

    if (checkError) throw checkError;
    const existing = (existingData || []) as any[];

    if (existing && existing.length > 0) {
        throw new Error("Já existe uma amizade ou um pedido pendente.");
    }

    const { error: insertError } = await supabase
        .from('friendships')
        .insert({
            user_id_1: requesterId,
            user_id_2: receiverId,
            status: 'pending',
        } as any);
    
    if (insertError) throw insertError;
};

export const acceptFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', friendshipId);

    if (error) throw error;
};

export const declineFriendRequest = async (friendshipId: string) => {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

    if (error) throw error;
};

export const getFriendsRanking = async (userId: string): Promise<WeeklyRankingData> => {
    const { data: friendshipsData, error: friendshipsError } = await supabase
        .from('friendships')
        .select('user_id_1, user_id_2')
        .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
        .eq('status', 'accepted');

    if (friendshipsError) throw friendshipsError;
    const friendships = (friendshipsData || []) as any[];
    
    const userAndFriendIds = new Set([userId]);
    friendships.forEach(f => {
        userAndFriendIds.add(f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);
    });
    const idsArray = Array.from(userAndFriendIds);

    if (idsArray.length <= 1) return { ranking: [], currentUserRank: null };
    
    const rankingData = await _getRankingForUserIds(idsArray, userId);
    
    // Friends ranking should not be sliced
    return { ...rankingData, ranking: rankingData.ranking };
};