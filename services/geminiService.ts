

import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, XpLogEvent, XpLogEntry, GamificationStats, DisciplinaParaIA, Friendship, FriendRequest, NivelDificuldade } from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';
import { Simulation } from '../stores/useStudyStore';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper para obter o user_id ---
const getUserId = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user.id) throw new Error("Usuário não autenticado.");
    return data.session.user.id;
}


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
export const getWeeklyRanking = async (userId: string) => {
    // This would typically be a database function (RPC) for performance
    console.warn("getWeeklyRanking not implemented with Supabase RPC, returning empty mock.");
    return { ranking: [], currentUserRank: null };
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

// Generic CRUD functions for simple tables
const createGenericCrud = <T extends { id: string }>(tableName: string) => ({
    get: async (studyPlanId: string): Promise<T[]> => {
        const { data, error } = await supabase.from(tableName).select('*').eq('study_plan_id', studyPlanId);
        if (error) throw error;
        return data as T[];
    },
    create: async (studyPlanId: string, itemData: Omit<T, 'id' | 'studyPlanId'>): Promise<T> => {
        const userId = await getUserId();
        const payload = { ...itemData, study_plan_id: studyPlanId, user_id: userId };
        // FIX: Cast data to any to bypass 'never' type issue.
        const { data, error } = await supabase.from(tableName).insert(payload as any).select().single();
        if (error) throw error;
        if (!data) throw new Error(`Failed to create item in ${tableName}, no data returned.`);
        return data as T;
    },
    update: async (id: string, updates: Partial<T>): Promise<T> => {
        // FIX: Cast data to any to bypass 'never' type issue.
        const { data, error } = await supabase.from(tableName).update(updates as any).eq('id', id).select().single();
        if (error) throw error;
        if (!data) throw new Error(`Failed to update item in ${tableName}, no data returned.`);
        return data as T;
    },
    remove: async (id: string): Promise<void> => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
    },
});

const sessoesCrud = createGenericCrud<SessaoEstudo>('sessoes_estudo');
export const getSessoes = sessoesCrud.get;
export const createSessao = sessoesCrud.create;
export const updateSessaoApi = sessoesCrud.update;
export const deleteSessao = sessoesCrud.remove;

const revisoesCrud = createGenericCrud<Revisao>('revisoes');
export const getRevisoes = revisoesCrud.get;
// This is now replaced by the custom implementation below
// export const createRevisao = revisoesCrud.create; 
export const updateRevisaoApi = revisoesCrud.update;
export const deleteRevisao = revisoesCrud.remove;

// Override createRevisao to handle camelCase -> snake_case mapping for disciplinaId
export const createRevisao = async (studyPlanId: string, itemData: Omit<Revisao, 'id' | 'studyPlanId'>): Promise<Revisao> => {
    const userId = await getUserId();
    // FIX: Removed incorrect mapping. The payload now correctly uses camelCase 'disciplinaId' as defined in the Supabase types.
    const payload = { ...itemData, study_plan_id: studyPlanId, user_id: userId };
    
    // FIX: Cast payload to any to resolve Supabase client 'never' type error
    const { data, error } = await supabase.from('revisoes').insert(payload as any).select().single();
    if (error) {
        console.error("Error creating revision:", error);
        throw error;
    }
    if (!data) throw new Error(`Failed to create item in revisoes, no data returned.`);
    
    // FIX: Removed incorrect mapping back. The data from Supabase already matches the 'Revisao' type.
    return data as Revisao;
};

const errosCrud = createGenericCrud<CadernoErro>('caderno_erros');
export const getErros = errosCrud.get;
// export const createErro = errosCrud.create; // Replaced by custom implementation below
// export const updateErroApi = errosCrud.update; // Replaced by custom implementation below
export const deleteErro = errosCrud.remove;

// Custom implementation for createErro to handle camelCase -> snake_case mapping
export const createErro = async (studyPlanId: string, itemData: Omit<CadernoErro, 'id' | 'studyPlanId'>): Promise<CadernoErro> => {
    const userId = await getUserId();
    // FIX: Removed incorrect manual mapping to snake_case. The payload now passes the camelCase properties from `itemData` directly, which matches the Supabase generated types.
    const payload = { 
        ...itemData,
        study_plan_id: studyPlanId, 
        user_id: userId,
    };
    
    // FIX: Cast payload to any to resolve Supabase client 'never' type error
    const { data, error } = await supabase.from('caderno_erros').insert(payload as any).select().single();
    if (error) {
        console.error("Error creating erro:", error);
        throw error;
    }
    if (!data) throw new Error(`Failed to create item in caderno_erros, no data returned.`);
    
    // FIX: Removed incorrect mapping from snake_case. The data returned from Supabase already has the correct camelCase properties and can be cast directly.
    return data as CadernoErro;
};

// Custom implementation for updateErroApi to handle camelCase -> snake_case mapping
export const updateErroApi = async (id: string, updates: Partial<CadernoErro>): Promise<CadernoErro> => {
    // FIX: Removed incorrect manual mapping to snake_case. The `updates` object already contains the correct camelCase property names as defined in the Supabase types.
    const payload = updates;

    // FIX: Cast payload to any to resolve Supabase client 'never' type error
    const { data, error } = await supabase.from('caderno_erros').update(payload as any).eq('id', id).select().single();
    if (error) {
        console.error("Error updating erro:", error);
        throw error;
    }
    if (!data) throw new Error(`Failed to update item in caderno_erros, no data returned.`);
    
    // FIX: Removed incorrect mapping from snake_case. The data returned from Supabase already has the correct camelCase properties.
    return data as CadernoErro;
};

const redacoesCrud = createGenericCrud<RedacaoCorrigida>('redacoes_corrigidas');
export const getRedacoes = redacoesCrud.get;
export const createRedacao = redacoesCrud.create;

// Ciclos (with nested sessoes_ciclo)
// ✅ Corrigido: Parâmetro renomeado de `editalId` para `studyPlanId` para consistência.
export const getCiclos = async (studyPlanId: string): Promise<Ciclo[]> => {
    const { data, error } = await supabase
        .from('ciclos')
        .select('*, sessoes_ciclo(*)')
        .eq('study_plan_id', studyPlanId);
    if (error) throw error;
    const ciclos = data.map(ciclo => {
        // FIX: Cast to any to allow spread
        const { sessoes_ciclo, ...rest } = ciclo as any;
        return { ...rest, sessoes: sessoes_ciclo || [] };
    });
    return ciclos as any as Ciclo[];
};
// ✅ Corrigido: Parâmetro renomeado de `editalId` para `studyPlanId` para consistência.
export const createCiclo = async (studyPlanId: string, cicloData: Omit<Ciclo, 'id' | 'studyPlanId'>): Promise<Ciclo> => {
    const userId = await getUserId();
    const { sessoes, ...cicloInfo } = cicloData;
    
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data: newCiclo, error: cicloError } = await supabase.from('ciclos').insert({ ...cicloInfo, study_plan_id: studyPlanId, user_id: userId } as any).select().single();
    if (cicloError) throw cicloError;

    if (sessoes && sessoes.length > 0) {
        if (!newCiclo) throw new Error("Failed to create ciclo.");
        const sessoesToInsert = sessoes.map(s => {
            const { id, ...rest } = s; // Destructure and remove client-side id
            return { ...rest, ciclo_id: (newCiclo as any).id, user_id: userId };
        });
        const { error: sessoesError } = await supabase.from('sessoes_ciclo').insert(sessoesToInsert as any);
        if (sessoesError) {
            console.error("Error inserting ciclo sessoes:", sessoesError);
            throw sessoesError;
        }
    }

    // FIX: Cast to any to allow spread
    return { ...(newCiclo as any), sessoes: sessoes || [] };
};
export const updateCicloApi = async (id: string, updates: Partial<Ciclo>): Promise<Ciclo> => {
    const userId = await getUserId();
    const { sessoes, ...cicloInfo } = updates;

    if (Object.keys(cicloInfo).length > 0) {
        // FIX: Cast data to any to bypass 'never' type issue.
        const { error } = await supabase.from('ciclos').update(cicloInfo as any).eq('id', id);
        if (error) throw error;
    }

    if (sessoes) {
        await supabase.from('sessoes_ciclo').delete().eq('ciclo_id', id);
        if (sessoes.length > 0) {
            const sessoesToInsert = sessoes.map(s => ({
                ciclo_id: id,
                user_id: userId,
                disciplina_id: s.disciplina_id,
                ordem: s.ordem,
                tempo_previsto: s.tempo_previsto,
            }));
             // FIX: Cast data to any to bypass 'never' type issue.
             const { error: insertError } = await supabase.from('sessoes_ciclo').insert(sessoesToInsert as any);
             if (insertError) throw insertError;
        }
    }
    
    const { data, error } = await supabase.from('ciclos').select('*, sessoes_ciclo(*)').eq('id', id).single();
    if (error) throw error;
    // FIX: Handle possible null data and cast to any for spread
    const { sessoes_ciclo, ...rest } = (data || {}) as any;
    return { ...rest, sessoes: sessoes_ciclo || [] } as any as Ciclo;
};
export const deleteCiclo = async (id: string) => {
    const { error } = await supabase.from('ciclos').delete().eq('id', id);
    if (error) throw error;
};


// Flashcards (assuming a dedicated table)
export const getFlashcards = async (topicoId: string) => {
    const { data, error } = await supabase.from('flashcards').select('*').eq('topico_id', topicoId);
    if (error) throw error;
    return data;
};
export const createFlashcards = async (topicoId: string, data: { flashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[] }) => {
    const userId = await getUserId();
    const flashcardsToInsert = data.flashcards.map(fc => ({
        ...fc,
        topico_id: topicoId,
        user_id: userId,
        interval: 1,
        easeFactor: 2.5,
        dueDate: new Date().toISOString(),
    }));
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data: newFlashcards, error } = await supabase.from('flashcards').insert(flashcardsToInsert as any).select();
    if (error) throw error;
    return newFlashcards;
};
export const updateFlashcardApi = async (id: string, updates: Partial<Flashcard>) => {
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('flashcards').update(updates as any).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteFlashcard = async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) throw error;
};

// Simulados have a different foreign key name
// ✅ Corrigido: Parâmetro renomeado de `editalId` para `studyPlanId` para consistência.
export const getSimulados = async (studyPlanId: string) => {
    const { data, error } = await supabase.from('simulados').select('*').eq('study_plan_id', studyPlanId);
    if (error) throw error;
    return data;
};
// ✅ Corrigido: Parâmetro renomeado de `editalId` para `studyPlanId` para consistência.
export const createSimulado = async (studyPlanId: string, simuladoData: any) => {
    const userId = await getUserId();
    const { studyPlanId: _camelCaseId, ...restOfData } = simuladoData;
    const payload = { ...restOfData, study_plan_id: studyPlanId, user_id: userId };
    const { data, error } = await supabase.from('simulados').insert(payload as any).select().single();
    if (error) throw error;
    const { study_plan_id, ...rest } = data as any;
    return { ...rest, studyPlanId: study_plan_id };
};
export const updateSimuladoApi = async (id: string, updates: any) => {
    const { studyPlanId, ...restOfUpdates } = updates;
    const { data, error } = await supabase.from('simulados').update(restOfUpdates as any).eq('id', id).select().single();
    if (error) throw error;
    const { study_plan_id, ...rest } = data as any;
    return { ...rest, studyPlanId: study_plan_id };
};
export const deleteSimulado = async (id: string) => {
    const { error } = await supabase.from('simulados').delete().eq('id', id);
    if (error) throw error;
};

// --- FRIENDS SERVICES (Requires table setup in Supabase) ---
export const getFriends = async (userId: string): Promise<User[]> => { console.warn("getFriends not implemented with Supabase"); return []; };
export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => { console.warn("getFriendRequests not implemented with Supabase"); return []; };
export const searchUsers = async (query: string, currentUserId: string): Promise<User[]> => { console.warn("searchUsers not implemented with Supabase"); return []; };
export const sendFriendRequest = async (requesterId: string, receiverId: string) => { console.warn("sendFriendRequest not implemented with Supabase"); };
export const acceptFriendRequest = async (friendshipId: string) => { console.warn("acceptFriendRequest not implemented with Supabase"); };
export const declineFriendRequest = async (friendshipId: string) => { console.warn("declineFriendRequest not implemented with Supabase"); };
export const getFriendsRanking = async (userId: string) => { console.warn("getFriendsRanking not implemented with Supabase"); return { ranking: [], currentUserRank: null }; };