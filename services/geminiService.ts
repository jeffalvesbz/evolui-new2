


import { GoogleGenAI, Type } from '@google/genai';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, XpLogEvent, XpLogEntry, GamificationStats, DisciplinaParaIA, Friendship } from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';
import * as mockData from '../data/mockData';
import { calculateStreakFromSessoes } from '../utils/calculateStreak';
import { subDays, isAfter } from 'date-fns';

// --- CONFIGURAÇÃO DO BACKEND ---
// Mude para 'false' para tentar usar o backend real em http://localhost:4000
const USE_MOCK_API = true;
const API_BASE_URL = 'http://localhost:4000/api';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// #region MOCK API IMPLEMENTATION
// =================================================================================
// Esta seção simula um backend usando o localStorage do navegador.
// Isso permite que o aplicativo funcione offline e contorna erros de conexão
// com um backend local (http) a partir de um site seguro (https).
// =================================================================================

const uuid = () => crypto.randomUUID();

let db: any = null;

const getDb = () => {
    if (db) return db;
    const savedDb = localStorage.getItem('evolui-db');
    if (savedDb) {
        db = JSON.parse(savedDb);
        return db;
    }
    db = {
        users: mockData.MOCK_USERS,
        editais: mockData.MOCK_EDITAIS,
        disciplinas: mockData.MOCK_DISCIPLINAS,
        sessoes: mockData.MOCK_SESSOES,
        revisoes: mockData.MOCK_REVISOES,
        erros: mockData.MOCK_ERROS,
        ciclos: mockData.MOCK_CICLOS,
        redacoes: mockData.MOCK_REDACOES,
        simulados: mockData.MOCK_SIMULADOS,
        flashcards: mockData.MOCK_FLASHCARDS,
        gamification_user_stats: mockData.MOCK_GAMIFICATION_STATS_LIST,
        gamification_xp_log: mockData.MOCK_XP_LOG,
        badges: mockData.MOCK_BADGES,
        friendships: mockData.MOCK_FRIENDSHIPS,
    };
    persist();
    return db;
};

const persist = () => {
    if (db) {
        localStorage.setItem('evolui-db', JSON.stringify(db));
    }
};

const mockApiFetch = async (endpoint: string, options: RequestInit = {}) => {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : {};
    const db = getDb();
    const url = new URL(`http://mock.api${endpoint}`);
    const pathParts = url.pathname.split('/').filter(Boolean);

    console.log(`[MOCK API] ${method} ${endpoint}`, body);
    await new Promise(res => setTimeout(res, 200)); // Simular latência de rede

    // --- Auth ---
    if (endpoint === '/auth/login' && method === 'POST') {
        const user = db.users.find(u => u.email === body.email);
        if (user && body.password === 'password') {
            return { token: `mock-token-${uuid()}`, user };
        }
        throw new Error("Credenciais inválidas (mock).");
    }

    // --- AI Proxies ---
    if (endpoint.startsWith('/ai/')) {
        if (endpoint === '/ai/generate-flashcards') return [{ pergunta: 'Qual a capital do Brasil?', resposta: 'Brasília.' }, { pergunta: 'Quanto é 2+2?', resposta: '4.' }];
        if (endpoint === '/ai/generate-flashcards-from-content') {
            await new Promise(res => setTimeout(res, 1500)); // Simulate AI thinking
            return [
                { pergunta: 'O que é Inquérito Policial?', resposta: 'Procedimento administrativo e investigatório, não-processual, presidido pela autoridade policial.', estilo: 'direto'},
                { pergunta: 'Explique o princípio da insignificância no Direito Penal.', resposta: 'Causa de exclusão da tipicidade material do fato, aplicável quando a lesão ao bem jurídico tutelado é ínfima.', estilo: 'explicativo' },
                { pergunta: 'O habeas corpus pode ser impetrado por ______.', resposta: 'qualquer pessoa', estilo: 'completar' },
                { pergunta: 'Qual a finalidade da prisão preventiva?', resposta: 'Garantia da ordem pública, da ordem econômica, por conveniência da instrução criminal ou para assegurar a aplicação da lei penal.', estilo: 'direto' },
                { pergunta: 'Diferencie dolo direto de dolo eventual.', resposta: 'No dolo direto, o agente quer o resultado. No dolo eventual, o agente assume o risco de produzi-lo.', estilo: 'explicativo' },
            ];
        }
        if (endpoint === '/ai/suggest-topics') return ['Tópico Sugerido 1', 'Tópico Sugerido 2'];
        // A correção de redação agora usa a API real, então este mock não será chamado por padrão.
        if (endpoint === '/ai/corrigir-redacao') return mockData.MOCK_CORRECAO_COMPLETA;
        if (endpoint === '/ai/extrair-texto-de-imagem') return { text: "Texto extraído da imagem com sucesso." };
        if (endpoint === '/ai/gerar-plano-estudos') {
            const { disciplinasComTopicos } = body;
            const allTopicIds = disciplinasComTopicos.flatMap((d: DisciplinaParaIA) => d.topicos.map((t: Topico) => t.id));
            if (allTopicIds.length === 0) return { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };

            const mockPlan: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
            const dias = ['seg', 'ter', 'qua', 'qui', 'sex']; // Estudo em dias úteis (exemplo)
            
            // Embaralha e distribui os tópicos
            const shuffledTopics = allTopicIds.sort(() => 0.5 - Math.random());
            shuffledTopics.forEach((topicId, index) => {
                const dia = dias[index % dias.length];
                mockPlan[dia].push(topicId);
            });
            await new Promise(res => setTimeout(res, 1500)); // Simular tempo de processamento da IA
            return mockPlan;
        }
    }
    
    // --- Generic CRUD ---
    const [resource, id, subResource] = pathParts;
    
    try {
        switch (resource) {
            case 'users':
                if (method === 'GET' && id === 'search') {
                    const query = url.searchParams.get('q')?.toLowerCase() || '';
                    const currentUserId = url.searchParams.get('currentUserId');
                    const friends = db.friendships.filter((f: Friendship) => f.user_id_1 === currentUserId || f.user_id_2 === currentUserId);
                    const friendIds = new Set(friends.map((f: Friendship) => f.user_id_1 === currentUserId ? f.user_id_2 : f.user_id_1));
                    
                    return db.users.filter((u: User) => 
                        u.id !== currentUserId &&
                        !friendIds.has(u.id) &&
                        u.name.toLowerCase().includes(query)
                    );
                }
                break;
            case 'friends':
                if (method === 'GET' && id) { // getFriends
                    const userId = id;
                    const friendIds = db.friendships
                        .filter((f: Friendship) => (f.user_id_1 === userId || f.user_id_2 === userId) && f.status === 'accepted')
                        .map((f: Friendship) => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);
                    return db.users.filter((u: User) => friendIds.includes(u.id));
                }
                break;
            case 'friend-requests':
                if (method === 'GET' && id) { // getFriendRequests
                    const userId = id;
                    return db.friendships
                        .filter((f: Friendship) => f.user_id_2 === userId && f.status === 'pending')
                        .map((f: Friendship) => {
                            const requester = db.users.find((u: User) => u.id === f.user_id_1);
                            const requesterStats = db.gamification_user_stats.find((s: GamificationStats) => s.user_id === f.user_id_1);
                            return {
                                friendship_id: f.id,
                                requester_id: f.user_id_1,
                                requester_name: requester?.name || 'Usuário',
                                requester_level: requesterStats?.level || 1,
                            };
                        });
                }
                if (method === 'POST') { // sendFriendRequest
                    const { requesterId, receiverId } = body;
                    const newRequest = { id: uuid(), user_id_1: requesterId, user_id_2: receiverId, status: 'pending', created_at: new Date().toISOString() };
                    db.friendships.push(newRequest);
                    return newRequest;
                }
                if (method === 'PUT' && id && subResource === 'accept') { // acceptFriendRequest
                    db.friendships = db.friendships.map((f: Friendship) => f.id === id ? { ...f, status: 'accepted' } : f);
                    return db.friendships.find((f: Friendship) => f.id === id);
                }
                if (method === 'PUT' && id && subResource === 'decline') { // declineFriendRequest
                    db.friendships = db.friendships.map((f: Friendship) => f.id === id ? { ...f, status: 'declined' } : f);
                    return db.friendships.find((f: Friendship) => f.id === id);
                }
                break;
            case 'badges':
                if (method === 'GET') return db.badges;
                break;
            case 'gamification':
                if (method === 'GET' && id === 'stats') {
                    const userId = subResource;
                    return db.gamification_user_stats.find(s => s.user_id === userId) || null;
                }
                 if (method === 'GET' && id === 'log') {
                    const userId = subResource;
// FIX: Use .getTime() for proper date comparison in sort to avoid arithmetic operations on Date objects.
                    return db.gamification_xp_log.filter((l: XpLogEntry) => l.user_id === userId).sort((a: XpLogEntry, b: XpLogEntry) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
                if (method === 'GET' && id === 'ranking' && subResource === 'weekly') {
                    const sevenDaysAgo = subDays(new Date(), 7);
                    const weeklyLogs = db.gamification_xp_log.filter((log: XpLogEntry) => isAfter(new Date(log.created_at), sevenDaysAgo));
                    
                    const weeklyXpByUser = weeklyLogs.reduce((acc: Record<string, number>, log: XpLogEntry) => {
                        acc[log.user_id] = (acc[log.user_id] || 0) + log.amount;
                        return acc;
                    }, {} as Record<string, number>);

                    const allUsers = [...db.users, ...mockData.MOCK_USERS_FOR_RANKING];
                    
                    const fullRanking = Object.entries(weeklyXpByUser).map(([userId, weekly_xp]) => {
                        const user = allUsers.find(u => u.id === userId);
                        const userStats = db.gamification_user_stats.find(s => s.user_id === userId);
                        return {
                            user_id: userId,
                            name: user?.name || 'Usuário Anônimo',
                            level: userStats?.level || 1,
                            weekly_xp,
                        };
                    })
                    .sort((a, b) => b.weekly_xp - a.weekly_xp);

                    const topRanking = fullRanking.slice(0, 10);
                    
                    const currentUserId = url.searchParams.get('userId');
                    let currentUserRank = null;
                    if (currentUserId) {
                        const rankIndex = fullRanking.findIndex(u => u.user_id === currentUserId);
                        if (rankIndex !== -1) {
                            currentUserRank = { ...fullRanking[rankIndex], rank: rankIndex + 1 };
                        }
                    }

                    return { ranking: topRanking, currentUserRank };
                }
                if (method === 'GET' && id === 'ranking' && subResource === 'friends') {
                    const userId = url.searchParams.get('userId');
                    if (!userId) throw new Error("userId is required for friends ranking");
                    const friendIds = db.friendships
                        .filter((f: Friendship) => (f.user_id_1 === userId || f.user_id_2 === userId) && f.status === 'accepted')
                        .map((f: Friendship) => f.user_id_1 === userId ? f.user_id_2 : f.user_id_1);
                    const allRelevantUserIds = [...friendIds, userId];

                    const sevenDaysAgo = subDays(new Date(), 7);
                    const weeklyLogs = db.gamification_xp_log.filter((log: XpLogEntry) => 
                        isAfter(new Date(log.created_at), sevenDaysAgo) && allRelevantUserIds.includes(log.user_id)
                    );
                    
                    const weeklyXpByUser = weeklyLogs.reduce((acc: Record<string, number>, log: XpLogEntry) => {
                        acc[log.user_id] = (acc[log.user_id] || 0) + log.amount;
                        return acc;
                    }, {} as Record<string, number>);

                    const allUsers: User[] = [...db.users, ...mockData.MOCK_USERS_FOR_RANKING];
                    
                    const fullRanking = allRelevantUserIds.map(uid => {
                        const user = allUsers.find(u => u.id === uid);
                        const userStats = db.gamification_user_stats.find((s: GamificationStats) => s.user_id === uid);
                        return {
                            user_id: uid,
                            name: user?.name || 'Usuário Anônimo',
                            level: userStats?.level || 1,
                            weekly_xp: weeklyXpByUser[uid] || 0,
                        };
                    })
                    .sort((a, b) => b.weekly_xp - a.weekly_xp);

                    const currentUserRankData = fullRanking.find(u => u.user_id === userId);
                    const currentUserRank = currentUserRankData ? { ...currentUserRankData, rank: fullRanking.findIndex(u => u.user_id === userId) + 1 } : null;
                    
                    return { ranking: fullRanking, currentUserRank };
                }
                if (method === 'POST' && id === 'log') {
                    const { userId, event, amount, meta, tipo_evento, multiplicador } = body;
                    const logEntry: XpLogEntry = { 
                        id: uuid(), 
                        user_id: userId, 
                        event, 
                        amount, 
                        meta_json: meta, 
                        created_at: new Date().toISOString(),
                        tipo_evento,
                        multiplicador,
                    };
                    db.gamification_xp_log.push(logEntry);
                    
                    let userStats = db.gamification_user_stats.find(s => s.user_id === userId);
                    if (userStats) {
                        userStats.xp_total += amount;
                        // --- Streak Logic ---
                        // Apenas eventos de estudo ativo contam para o streak
                        if (event === 'cronometro_finalizado') {
                            const userSessoes = db.sessoes;
                            const streak = calculateStreakFromSessoes(userSessoes);
                            userStats.current_streak_days = streak;
                            if (streak > userStats.best_streak_days) {
                                userStats.best_streak_days = streak;
                            }
                        }

                    } else {
                        const initialStreak = tipo_evento === 'ativo' ? 1 : 0;
                        userStats = { user_id: userId, xp_total: amount, level: 1, current_streak_days: initialStreak, best_streak_days: initialStreak, unlockedBadgeIds: [] };
                        db.gamification_user_stats.push(userStats);
                    }
                    return logEntry;
                }
                if (method === 'PUT' && id === 'stats') {
                    const userId = subResource;
                    let userStats = db.gamification_user_stats.find(s => s.user_id === userId);
                    if (userStats) {
                        // Only update fields provided in the body (xp_total, unlockedBadgeIds)
                        if (body.xp_total) userStats.xp_total = body.xp_total;
                        if (body.unlockedBadgeIds) userStats.unlockedBadgeIds = body.unlockedBadgeIds;
                    }
                    return userStats;
                }
                break;
            case 'editais':
                if (method === 'GET' && !id) return db.editais;
                if (method === 'POST') {
                    const alreadyExists = db.editais.some((e: StudyPlan) => e.nome === body.nome && e.data_alvo === body.data_alvo);
                    if (alreadyExists) {
                        console.warn(`[MOCK API] Duplicate edital creation prevented: "${body.nome}"`);
                        return db.editais.find((e: StudyPlan) => e.nome === body.nome && e.data_alvo === body.data_alvo);
                    }
                    const newEdital = { ...body, id: uuid() };
                    db.editais.push(newEdital);
                    return newEdital;
                }
                if (method === 'PUT' && id) {
                    db.editais = db.editais.map(e => e.id === id ? { ...e, ...body, id } : e);
                    return db.editais.find(e => e.id === id);
                }
                if (method === 'DELETE' && id) {
                    db.editais = db.editais.filter(e => e.id !== id);
                    // Cascade delete
                    db.disciplinas = db.disciplinas.filter(d => d.studyPlanId !== id);
                    db.sessoes = db.sessoes.filter(s => s.studyPlanId !== id);
                    return null;
                }
                if (method === 'GET' && id && subResource) {
                    const parentId = id;
                     if (subResource === 'disciplinas') return db.disciplinas.filter(d => d.studyPlanId === parentId);
                     if (subResource === 'sessoes') return db.sessoes.filter(s => s.studyPlanId === parentId);
                     if (subResource === 'revisoes') return db.revisoes.filter(r => r.studyPlanId === parentId);
                     if (subResource === 'erros') return db.erros.filter(e => e.studyPlanId === parentId);
                     if (subResource === 'ciclos') return db.ciclos.filter(c => c.studyPlanId === parentId);
                     if (subResource === 'redacoes') return db.redacoes.filter(r => r.studyPlanId === parentId);
                     if (subResource === 'simulados') return db.simulados.filter(s => s.edital_id === parentId);
                }
                if(method === 'POST' && id && subResource){
                    const parentId = id;
                    const newSubItem = { ...body, id: uuid(), studyPlanId: parentId };
                    if (subResource === 'disciplinas') newSubItem.progresso = 0;
                    if (subResource === 'simulados') newSubItem.edital_id = parentId; // compatibility with simulado type
                    db[subResource].push(newSubItem);
                    return newSubItem;
                }
                break;
            case 'disciplinas':
                 if (method === 'PUT' && id) {
                    db.disciplinas = db.disciplinas.map(d => d.id === id ? { ...d, ...body, id } : d);
                    return db.disciplinas.find(d => d.id === id);
                }
                if (method === 'DELETE' && id) {
                    db.disciplinas = db.disciplinas.filter(d => d.id !== id);
                    return null;
                }
                if(method === 'POST' && id && subResource === 'topicos'){
                     const newTopico = { ...body, id: uuid() };
                     const disciplina = db.disciplinas.find(d => d.id === id);
                     disciplina.topicos.push(newTopico);
                     return newTopico;
                }
                break;
            case 'topicos':
                if (method === 'PUT' && id) {
                    let updatedTopico;
                    db.disciplinas.forEach(d => {
                        d.topicos = d.topicos.map(t => {
                            if(t.id === id) {
                                updatedTopico = { ...t, ...body, id};
                                return updatedTopico;
                            }
                            return t;
                        });
                    });
                    return updatedTopico;
                }
                if (method === 'GET' && id && subResource === 'flashcards') {
                    return db.flashcards.filter(f => f.topico_id === id);
                }
                if (method === 'POST' && id && subResource === 'flashcards') {
                    const newFlashcards = body.flashcards.map(fc => ({
                        ...fc,
                        id: uuid(),
                        topico_id: id,
                        interval: 1,
                        easeFactor: 2.5,
                        dueDate: new Date().toISOString()
                    }));
                    db.flashcards.push(...newFlashcards);
                    return newFlashcards;
                }
                break;
            case 'sessoes':
            case 'revisoes':
            case 'erros':
            case 'ciclos':
            case 'flashcards':
            case 'simulados':
                const resourceDb = resource === 'simulados' ? 'simulados' : resource;
                 if (method === 'PUT' && id) {
                    db[resourceDb] = db[resourceDb].map(item => item.id === id ? { ...item, ...body, id } : item);
                    return db[resourceDb].find(item => item.id === id);
                }
                if (method === 'DELETE' && id) {
                    db[resourceDb] = db[resourceDb].filter(item => item.id !== id);
                    return null;
                }
                break;
        }

        throw new Error(`[MOCK API] Rota não encontrada: ${method} ${endpoint}`);
    } finally {
        persist();
    }
};

// #endregion

// =================================================================================
// Esta seção é para o backend real. Ela tentará fazer uma chamada `fetch`.
// Será usada se `USE_MOCK_API` for `false`.
// =================================================================================
const realApiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = { ...options.headers };
  
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body) {
      headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = { ...options, headers };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorBody.message || `Erro ${response.status}`);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`[API FETCH ERROR] ${options.method || 'GET'} ${url}:`, error);
    throw error;
  }
};

// --- API Fetch Abstraction ---
const apiFetch = USE_MOCK_API ? mockApiFetch : realApiFetch;


// --- AUTH SERVICE ---
export const login = (email, password) => apiFetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});


// --- AI PROXY SERVICES ---
export const generateFlashcards = async (topicName: string): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
  return apiFetch('/ai/generate-flashcards', {
    method: 'POST',
    body: JSON.stringify({ topicName }),
  });
};

export const generateFlashcardsFromContent = async (disciplinaId: string): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
    return apiFetch('/ai/generate-flashcards-from-content', {
        method: 'POST',
        body: JSON.stringify({ disciplinaId })
    });
};

export const suggestTopics = async (comment: string): Promise<string[]> => {
  return apiFetch('/ai/suggest-topics', {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
};

const correcaoSchema = {
    type: Type.OBJECT,
    properties: {
        banca: { type: Type.STRING, description: "A banca examinadora para a qual a redação foi corrigida." },
        notaMaxima: { type: Type.NUMBER, description: "A nota máxima possível para a redação." },
        avaliacaoDetalhada: {
            type: Type.ARRAY,
            description: "Uma lista de avaliações para cada critério da banca.",
            items: {
                type: Type.OBJECT,
                properties: {
                    criterio: { type: Type.STRING, description: "O nome do critério de avaliação." },
                    pontuacao: { type: Type.NUMBER, description: "A pontuação obtida no critério." },
                    maximo: { type: Type.NUMBER, description: "A pontuação máxima do critério." },
                    feedback: { type: Type.STRING, description: "Feedback detalhado sobre o desempenho no critério." },
                },
                required: ['criterio', 'pontuacao', 'maximo', 'feedback']
            }
        },
        comentariosGerais: { type: Type.STRING, description: "Um feedback geral sobre a redação, com pontos fortes e fracos." },
        notaFinal: { type: Type.NUMBER, description: "A nota final atribuída à redação." },
        errosDetalhados: {
            type: Type.ARRAY,
            description: "Uma lista de erros específicos encontrados no texto.",
            items: {
                type: Type.OBJECT,
                properties: {
                    trecho: { type: Type.STRING, description: "O trecho exato do texto onde o erro foi encontrado." },
                    tipo: { type: Type.STRING, description: "O tipo de erro (ex: Gramática, Coerência)." },
                    explicacao: { type: Type.STRING, description: "Uma explicação clara sobre o erro." },
                    sugestao: { type: Type.STRING, description: "Uma sugestão de como corrigir o trecho." },
                },
                required: ['trecho', 'tipo', 'explicacao', 'sugestao']
            }
        }
    },
    required: ['banca', 'notaMaxima', 'avaliacaoDetalhada', 'comentariosGerais', 'notaFinal', 'errosDetalhados']
};

export const corrigirRedacao = async (redacao: string, banca: string, notaMaxima: number, tema?: string): Promise<CorrecaoCompleta> => {
    try {
        const prompt = `
            Por favor, atue como um corretor de redação experiente. Analise a seguinte redação com base nos critérios da banca examinadora "${banca}".
            A nota máxima para esta redação é ${notaMaxima}.
            
            O tema da redação é: "${tema || 'Não especificado'}".
            
            Texto da Redação:
            ---
            ${redacao}
            ---
            
            Sua análise deve ser detalhada, apontando erros gramaticais, de coesão, coerência, argumentação e adequação ao tema e à proposta.
            Forneça um feedback construtivo para cada critério de avaliação da banca "${banca}".
            
            Retorne sua análise estritamente no formato JSON, seguindo o schema fornecido.
            - "banca": Deve ser a string "${banca}".
            - "notaMaxima": Deve ser o número ${notaMaxima}.
            - "avaliacaoDetalhada": Forneça a pontuação e feedback para cada critério da banca. A soma das pontuações máximas dos critérios deve ser igual à nota máxima.
            - "comentariosGerais": Um parágrafo com um feedback geral sobre o texto, pontos fortes e fracos, e sugestões de melhoria.
            - "notaFinal": A nota final calculada com base na sua avaliação.
            - "errosDetalhados": Uma lista de erros específicos encontrados no texto, com o trecho exato, o tipo de erro, uma explicação e uma sugestão de correção. Identifique os erros mais importantes. Se não houver erros, retorne uma lista vazia.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: correcaoSchema
            },
        });
        
        let jsonText = response.text.trim();
        // Limpa o bloco de código markdown se a API o retornar
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7, -3).trim();
        }
        
        const correcao = JSON.parse(jsonText) as CorrecaoCompleta;
        return correcao;

    } catch (error) {
        console.error("Erro ao corrigir redação com a API Gemini:", error);
        throw new Error("Não foi possível processar a correção da redação. A resposta da IA pode ser inválida.");
    }
};

export const extrairTextoDeImagem = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType,
                data: base64Image,
            },
        };

        const textPart = {
            text: "Transcreva o texto contido nesta imagem. Se for uma redação manuscrita, transcreva o texto completo. Se não houver texto legível, retorne uma string vazia.",
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Erro ao extrair texto com a API Gemini:", error);
        throw new Error("Não foi possível extrair o texto da imagem.");
    }
};

export const gerarPlanoDeEstudosIA = async (objetivo: string, horasSemanais: number, disciplinasComTopicos: DisciplinaParaIA[]): Promise<TrilhaSemanalData> => {
    return apiFetch('/ai/gerar-plano-estudos', {
        method: 'POST',
        body: JSON.stringify({ objetivo, horasSemanais, disciplinasComTopicos }),
    });
};

export const sugerirCicloIA = async (disciplinas: { id: string, nome: string, dificuldade: string }[], tempoTotalMinutos: number): Promise<{disciplina_id: string, tempo_previsto: number}[]> => {
    const prompt = `
        Como um especialista em planejamento de estudos, crie uma sugestão de distribuição de tempo para um ciclo de estudos.
        O tempo total para uma rotação completa do ciclo é de ${tempoTotalMinutos} minutos.
        As matérias e suas dificuldades percebidas pelo estudante são:
        ${disciplinas.map(d => `- ${d.nome} (ID: ${d.id}, Dificuldade: ${d.dificuldade})`).join('\n')}

        Regras:
        1. Distribua os ${tempoTotalMinutos} minutos totais entre as matérias. Matérias "difíceis" devem receber mais tempo que as "médias", e "médias" mais que as "fáceis".
        2. A soma dos tempos alocados deve ser exatamente ${tempoTotalMinutos} minutos.
        3. Retorne o resultado como um array JSON de objetos, onde cada objeto contém "disciplina_id" (string) e "tempo_previsto" (número em minutos).
        4. Não inclua nenhuma outra informação ou texto explicativo na sua resposta, apenas o array JSON.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                disciplina_id: { type: Type.STRING },
                tempo_previsto: { type: Type.NUMBER },
            },
            required: ['disciplina_id', 'tempo_previsto']
        }
    };

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            },
        });
        
        let jsonText = response.text.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7, -3).trim();
        }
        
        const sugestao = JSON.parse(jsonText) as {disciplina_id: string, tempo_previsto: number}[];
        // Converter minutos para segundos
        return sugestao.map(s => ({ ...s, tempo_previsto: s.tempo_previsto * 60 }));

    } catch (error) {
        console.error("Erro ao sugerir ciclo com a API Gemini:", error);
        throw new Error("Não foi possível gerar a sugestão de ciclo.");
    }
};

export const gerarMensagemMotivacionalIA = async (
    userName: string, 
    tempoHojeMin: number, 
    metaPercentual: number,
    streakDays: number,
    revisoesPendentes: number
): Promise<string> => {
    try {
        const prompt = `
            Você é um coach de estudos amigável e motivador chamado Evolui.
            Seu objetivo é gerar uma mensagem curta e personalizada para o usuário ${userName}, com base em seu progresso de hoje.
            Seja encorajador e inspirador. Use uma linguagem informal e positiva. Fale diretamente com ${userName}.
            A mensagem deve ter no máximo 2 ou 3 frases.

            Aqui estão os dados do usuário hoje:
            - Nome: ${userName}
            - Tempo total de estudo hoje: ${tempoHojeMin} minutos.
            - Percentual da meta diária concluída: ${metaPercentual}%.
            - Dias seguidos estudando (streak): ${streakDays} dias.
            - Revisões pendentes para hoje: ${revisoesPendentes} revisões.

            Analise os dados e crie uma mensagem.
            - Se o progresso for bom (ex: mais de 50% da meta, ou estudou bastante), elogie o esforço.
            - Se o progresso for baixo, incentive-o a começar, lembrando que cada passo conta.
            - Mencione o streak de forma positiva se for maior que 1.
            - Se houver revisões pendentes, mencione-as de forma encorajadora, como um próximo passo.
            - Não use "Olá" ou saudações, vá direto para a mensagem.
            - Não inclua aspas na sua resposta. Retorne apenas o texto da mensagem.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Erro ao gerar mensagem motivacional com a API Gemini:", error);
        // Fallback message
        return "Continue focado nos seus objetivos. Cada passo que você dá hoje te aproxima da sua aprovação!";
    }
};


// --- GAMIFICATION SERVICES ---
export const getGamificationStats = (userId: string) => apiFetch(`/gamification/stats/${userId}`);
export const updateGamificationStats = (userId: string, data: Partial<GamificationStats>) => apiFetch(`/gamification/stats/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
});
export const logXpEvent = (userId: string, event: XpLogEvent, amount: number, meta: Record<string, any> = {}, tipo_evento: 'ativo' | 'manual', multiplicador: number) => apiFetch('/gamification/log', {
    method: 'POST',
    body: JSON.stringify({ userId, event, amount, meta, tipo_evento, multiplicador }),
});
export const getBadges = () => apiFetch('/badges');
export const getXpLog = (userId: string) => apiFetch(`/gamification/log/${userId}`);
export const getWeeklyRanking = (userId: string) => apiFetch(`/gamification/ranking/weekly?userId=${userId}`);


// --- DATA SERVICES ---
// A interface dessas funções permanece a mesma. Apenas a implementação de `apiFetch` mudou.

// Editais (StudyPlan)
export const getEditais = () => apiFetch('/editais');
export const createEdital = (data: any) => apiFetch('/editais', { method: 'POST', body: JSON.stringify(data) });
export const updateEditalApi = (id: string, data: any) => apiFetch(`/editais/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteEdital = (id: string) => apiFetch(`/editais/${id}`, { method: 'DELETE' });

// Disciplinas
export const getDisciplinas = (editalId: string) => apiFetch(`/editais/${editalId}/disciplinas`);
export const createDisciplina = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/disciplinas`, { method: 'POST', body: JSON.stringify(data) });
export const updateDisciplinaApi = (id: string, data: any) => apiFetch(`/disciplinas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDisciplina = (id: string) => apiFetch(`/disciplinas/${id}`, { method: 'DELETE' });

// Tópicos
export const createTopico = (disciplinaId: string, data: any) => apiFetch(`/disciplinas/${disciplinaId}/topicos`, { method: 'POST', body: JSON.stringify(data) });
export const updateTopicoApi = (id: string, data: any) => apiFetch(`/topicos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTopico = (id: string) => apiFetch(`/topicos/${id}`, { method: 'DELETE' });

// Sessões de Estudo
export const getSessoes = (editalId: string) => apiFetch(`/editais/${editalId}/sessoes`);
export const createSessao = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/sessoes`, { method: 'POST', body: JSON.stringify(data) });
export const updateSessaoApi = (id: string, data: any) => apiFetch(`/sessoes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSessao = (id: string) => apiFetch(`/sessoes/${id}`, { method: 'DELETE' });

// Revisões, Caderno de Erros, Ciclos, Flashcards, Redações, Simulados...
export const getRevisoes = (editalId: string) => apiFetch(`/editais/${editalId}/revisoes`);
export const createRevisao = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/revisoes`, { method: 'POST', body: JSON.stringify(data) });
export const updateRevisaoApi = (id: string, data: any) => apiFetch(`/revisoes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRevisao = (id: string) => apiFetch(`/revisoes/${id}`, { method: 'DELETE' });

export const getErros = (editalId: string) => apiFetch(`/editais/${editalId}/erros`);
export const createErro = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/erros`, { method: 'POST', body: JSON.stringify(data) });
export const updateErroApi = (id: string, data: any) => apiFetch(`/erros/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteErro = (id: string) => apiFetch(`/erros/${id}`, { method: 'DELETE' });

export const getCiclos = (editalId: string) => apiFetch(`/editais/${editalId}/ciclos`);
export const createCiclo = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/ciclos`, { method: 'POST', body: JSON.stringify(data) });
export const updateCicloApi = (id: string, data: any) => apiFetch(`/ciclos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteCiclo = (id: string) => apiFetch(`/ciclos/${id}`, { method: 'DELETE' });

export const getFlashcards = (topicoId: string) => apiFetch(`/topicos/${topicoId}/flashcards`);
export const createFlashcards = (topicoId: string, data: any) => apiFetch(`/topicos/${topicoId}/flashcards`, { method: 'POST', body: JSON.stringify(data) });
export const updateFlashcardApi = (id: string, data: any) => apiFetch(`/flashcards/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteFlashcard = (id: string) => apiFetch(`/flashcards/${id}`, { method: 'DELETE' });

export const getRedacoes = (editalId: string) => apiFetch(`/editais/${editalId}/redacoes`);
export const createRedacao = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/redacoes`, { method: 'POST', body: JSON.stringify(data) });

export const getSimulados = (editalId: string) => apiFetch(`/editais/${editalId}/simulados`);
export const createSimulado = (editalId: string, data: any) => apiFetch(`/editais/${editalId}/simulados`, { method: 'POST', body: JSON.stringify(data) });
export const updateSimuladoApi = (id: string, data: any) => apiFetch(`/simulados/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSimulado = (id: string) => apiFetch(`/simulados/${id}`, { method: 'DELETE' });

// --- FRIENDS SERVICES ---
export const getFriends = (userId: string) => apiFetch(`/friends/${userId}`);
export const getFriendRequests = (userId: string) => apiFetch(`/friend-requests/${userId}`);
export const searchUsers = (query: string, currentUserId: string) => apiFetch(`/users/search?q=${query}&currentUserId=${currentUserId}`);
export const sendFriendRequest = (requesterId: string, receiverId: string) => apiFetch('/friend-requests', {
    method: 'POST',
    body: JSON.stringify({ requesterId, receiverId }),
});
export const acceptFriendRequest = (friendshipId: string) => apiFetch(`/friend-requests/${friendshipId}/accept`, { method: 'PUT' });
export const declineFriendRequest = (friendshipId: string) => apiFetch(`/friend-requests/${friendshipId}/decline`, { method: 'PUT' });
export const getFriendsRanking = (userId: string) => apiFetch(`/gamification/ranking/friends?userId=${userId}`);