
import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, XpLogEvent, XpLogEntry, GamificationStats, DisciplinaParaIA, Friendship, FriendRequest } from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';

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
export const getGamificationStats = async (userId: string) => {
    const { data, error } = await supabase.from('gamification_user_stats').select('*').eq('user_id', userId).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
};
export const updateGamificationStats = async (userId: string, data: Partial<GamificationStats>) => {
    const { data: updatedData, error } = await supabase.from('gamification_user_stats').update(data).eq('user_id', userId).select().single();
    if (error) throw error;
    return updatedData;
};
export const logXpEvent = async (userId: string, event: XpLogEvent, amount: number, meta: Record<string, any> = {}, tipo_evento: 'ativo' | 'manual', multiplicador: number) => {
    const { data, error } = await supabase.from('gamification_xp_log').insert({ user_id: userId, event, amount, meta_json: meta, tipo_evento, multiplicador }).select().single();
    if (error) throw error;
    return data;
};
export const getBadges = async () => {
    const { data, error } = await supabase.from('badges').select('*');
    if (error) throw error;
    return data;
};
export const getXpLog = async (userId: string) => {
    const { data, error } = await supabase.from('gamification_xp_log').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};
export const getWeeklyRanking = async (userId: string) => {
    // This would typically be a database function (RPC) for performance
    console.warn("getWeeklyRanking not implemented with Supabase RPC, returning empty mock.");
    return { ranking: [], currentUserRank: null };
};


// --- DATA SERVICES ---

// Editais (StudyPlan)
export const getEditais = async () => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('editais').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
};
export const createEdital = async (editalData: Omit<StudyPlan, 'id'>) => {
    const userId = await getUserId();
    const { data, error } = await supabase.from('editais').insert({ ...editalData, user_id: userId }).select().single();
    if (error) throw error;
    return data;
};
export const updateEditalApi = async (id: string, updates: Partial<StudyPlan>) => {
    const { data, error } = await supabase.from('editais').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteEdital = async (id: string) => {
    const { error } = await supabase.from('editais').delete().eq('id', id);
    if (error) throw error;
};

// Disciplinas
export const getDisciplinas = async (editalId: string) => {
    const { data, error } = await supabase.from('disciplinas').select('*').eq('studyPlanId', editalId);
    if (error) throw error;
    return data;
};
export const createDisciplina = async (editalId: string, disciplinaData: Omit<Disciplina, 'id' | 'progresso' | 'studyPlanId'>) => {
    const userId = await getUserId();
    const payload = { ...disciplinaData, studyPlanId: editalId, progresso: 0, user_id: userId };
    const { data, error } = await supabase.from('disciplinas').insert(payload).select().single();
    if (error) throw error;
    return data;
};
export const updateDisciplinaApi = async (id: string, updates: Partial<Disciplina>) => {
    const { data, error } = await supabase.from('disciplinas').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteDisciplina = async (id: string) => {
    const { error } = await supabase.from('disciplinas').delete().eq('id', id);
    if (error) throw error;
};

// Tópicos (assumes 'topicos' is a JSONB column in 'disciplinas' table)
export const createTopico = async (disciplinaId: string, topicoData: Omit<Topico, 'id'>) => {
    // This is more complex with Supabase. You'd typically use an RPC or fetch-then-update.
    const { data: disciplina, error } = await supabase.from('disciplinas').select('topicos').eq('id', disciplinaId).single();
    if (error) throw error;
    const newTopico = { ...topicoData, id: crypto.randomUUID() };
    const updatedTopicos = [...(disciplina.topicos || []), newTopico];
    await updateDisciplinaApi(disciplinaId, { topicos: updatedTopicos });
    return newTopico;
};
export const updateTopicoApi = async (topicoId: string, updates: Partial<Topico>) => {
     // This requires finding which disciplina the topic belongs to first.
     console.warn("updateTopicoApi is complex and not fully implemented for JSONB updates.");
     // Find the disciplina, update its topics array, then save the disciplina.
     return { id: topicoId, ...updates };
};
export const deleteTopico = async (id: string) => {
    console.warn("deleteTopico is complex and not implemented for JSONB updates.");
};

// Generic CRUD functions for simple tables
const createGenericCrud = <T extends { id: string }>(tableName: string) => ({
    get: async (editalId: string): Promise<T[]> => {
        const { data, error } = await supabase.from(tableName).select('*').eq('studyPlanId', editalId);
        if (error) throw error;
        return data as T[];
    },
    create: async (editalId: string, itemData: Omit<T, 'id' | 'studyPlanId'>): Promise<T> => {
        const userId = await getUserId();
        const payload = { ...itemData, studyPlanId: editalId, user_id: userId };
        const { data, error } = await supabase.from(tableName).insert(payload).select().single();
        if (error) throw error;
        return data as T;
    },
    update: async (id: string, updates: Partial<T>): Promise<T> => {
        const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data as T;
    },
    remove: async (id: string): Promise<void> => {
        const { error } = await supabase.from(tableName).delete().eq('id', id);
        if (error) throw error;
    },
});

const sessoesCrud = createGenericCrud<SessaoEstudo>('sessoes');
export const getSessoes = sessoesCrud.get;
export const createSessao = sessoesCrud.create;
export const updateSessaoApi = sessoesCrud.update;
export const deleteSessao = sessoesCrud.remove;

const revisoesCrud = createGenericCrud<Revisao>('revisoes');
export const getRevisoes = revisoesCrud.get;
export const createRevisao = revisoesCrud.create;
export const updateRevisaoApi = revisoesCrud.update;
export const deleteRevisao = revisoesCrud.remove;

const errosCrud = createGenericCrud<CadernoErro>('erros');
export const getErros = errosCrud.get;
export const createErro = errosCrud.create;
export const updateErroApi = errosCrud.update;
export const deleteErro = errosCrud.remove;

const ciclosCrud = createGenericCrud<Ciclo>('ciclos');
export const getCiclos = ciclosCrud.get;
export const createCiclo = ciclosCrud.create;
export const updateCicloApi = ciclosCrud.update;
export const deleteCiclo = ciclosCrud.remove;

const redacoesCrud = createGenericCrud<RedacaoCorrigida>('redacoes');
export const getRedacoes = redacoesCrud.get;
export const createRedacao = redacoesCrud.create;

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
    const { data: newFlashcards, error } = await supabase.from('flashcards').insert(flashcardsToInsert).select();
    if (error) throw error;
    return newFlashcards;
};
export const updateFlashcardApi = async (id: string, updates: Partial<Flashcard>) => {
    const { data, error } = await supabase.from('flashcards').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};
export const deleteFlashcard = async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);
    if (error) throw error;
};

// Simulados have a different foreign key name
export const getSimulados = async (editalId: string) => {
    const { data, error } = await supabase.from('simulados').select('*').eq('edital_id', editalId);
    if (error) throw error;
    return data;
};
export const createSimulado = async (editalId: string, simuladoData: any) => {
    const userId = await getUserId();
    const payload = { ...simuladoData, edital_id: editalId, user_id: userId };
    const { data, error } = await supabase.from('simulados').insert(payload).select().single();
    if (error) throw error;
    return data;
};
export const updateSimuladoApi = async (id: string, updates: any) => {
    const { data, error } = await supabase.from('simulados').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
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