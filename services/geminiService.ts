import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, XpLogEvent, XpLogEntry, GamificationStats, DisciplinaParaIA, Friendship } from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';
import * as mockData from '../data/mockData';
import { calculateStreakFromSessoes } from '../utils/calculateStreak';
import { subDays, isAfter } from 'date-fns';

// --- CONFIGURAÇÃO DO BACKEND ---
// Mude para 'false' para tentar usar o backend real em http://localhost:4000
const USE_MOCK_API = true;
const API_BASE_URL = 'http://localhost:4000/api';

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
        if (endpoint === '/ai/suggest-topics') return ['Tópico Sugerido 1', 'Tópico Sugerido 2'];
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
                    return db.gamification_xp_log.filter(l => l.user_id === userId).sort((a: XpLogEntry, b: XpLogEntry) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                }
                if (method === 'GET' && id === 'ranking' && subResource === 'weekly') {
                    const sevenDaysAgo = subDays(new Date(), 7);
                    const weeklyLogs = db.gamification_xp_log.filter((log: XpLogEntry) => isAfter(new Date(log.created_at), sevenDaysAgo));
                    
                    const weeklyXpByUser = weeklyLogs.reduce((acc: Record<string, number>, log: XpLogEntry) => {
                        acc[log.user_id] = (acc[log.user_id] || 0) + log.amount;
                        return acc;
                    }, {});

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
                    }, {});

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
                        // FIX: Cast `amount` to a number to ensure the arithmetic operation is valid and prevent type errors, as the type from JSON.parse is 'any'.
                        userStats.xp_total += Number(amount);
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

export const suggestTopics = async (comment: string): Promise<string[]> => {
  return apiFetch('/ai/suggest-topics', {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
};

export const corrigirRedacao = async (redacao: string, banca: string, notaMaxima: number, tema?: string): Promise<CorrecaoCompleta> => {
    return apiFetch('/ai/corrigir-redacao', {
        method: 'POST',
        body: JSON.stringify({ redacao, banca, notaMaxima, tema }),
    });
};

export const extrairTextoDeImagem = async (base64Image: string, mimeType: string): Promise<string> => {
    const { text } = await apiFetch('/ai/extrair-texto-de-imagem', {
        method: 'POST',
        body: JSON.stringify({ image: base64Image, mimeType }),
    });
    return text;
};

export const gerarPlanoDeEstudosIA = async (objetivo: string, horasSemanais: number, disciplinasComTopicos: DisciplinaParaIA[]): Promise<TrilhaSemanalData> => {
    return apiFetch('/ai/gerar-plano-estudos', {
        method: 'POST',
        body: JSON.stringify({ objetivo, horasSemanais, disciplinasComTopicos }),
    });
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