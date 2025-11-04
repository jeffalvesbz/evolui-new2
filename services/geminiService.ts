import { GoogleGenAI, Type } from '@google/genai';
import { subDays } from 'date-fns';
import {
  Flashcard,
  CorrecaoCompleta,
  RedacaoCorrigida,
  User,
  StudyPlan,
  Disciplina,
  Topico,
  SessaoEstudo,
  Ciclo,
  SessaoCiclo,
  Revisao,
  CadernoErro,
  XpLogEvent,
  XpLogEntry,
  GamificationStats,
  DisciplinaParaIA,
  Badge,
  Friendship,
  FriendRequest,
  Simulation,
} from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';
import { supabase } from './supabaseClient';
import { selectFrom, insertInto, updateRow, deleteFrom } from './supabaseHelpers';
import type { Tables } from '../types/supabase';

const API_BASE_URL = 'http://localhost:4000/api';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const toArray = <T>(rows: T[] | null | undefined): T[] => rows ?? [];

type DisciplinaWithTopicos = Tables<'disciplinas'> & { topicos?: Tables<'topicos'>[] | null };
type CicloWithSessions = Tables<'ciclos'> & { ciclo_sessoes?: Tables<'ciclo_sessoes'>[] | null };

const mapUser = (row: Tables<'users'>): User => ({
  id: row.id,
  name: row.name ?? 'Usuário',
  email: row.email ?? '',
});

const mapStudyPlan = (row: Tables<'editais'>): StudyPlan => ({
  id: row.id,
  nome: row.nome,
  descricao: row.descricao ?? '',
  data_alvo: row.data_alvo ?? '',
  banca: row.banca ?? undefined,
  orgao: row.orgao ?? undefined,
});

const mapTopico = (row: Tables<'topicos'>): Topico => ({
  id: row.id,
  titulo: row.titulo,
  concluido: row.concluido,
  nivelDificuldade: row.nivel_dificuldade,
  ultimaRevisao: row.ultima_revisao,
  proximaRevisao: row.proxima_revisao,
});

const mapDisciplina = (row: DisciplinaWithTopicos): Disciplina => ({
  id: row.id,
  nome: row.nome,
  progresso: row.progresso ?? 0,
  anotacoes: row.anotacoes ?? '',
  topicos: toArray(row.topicos).map(mapTopico),
  studyPlanId: row.study_plan_id,
});

const mapSessaoEstudo = (row: Tables<'sessoes'>): SessaoEstudo => ({
  id: row.id,
  topico_id: row.topico_id,
  tempo_estudado: row.tempo_estudado,
  data_estudo: row.data_estudo,
  comentarios: row.comentarios ?? undefined,
  studyPlanId: row.study_plan_id,
});

const mapRevisao = (row: Tables<'revisoes'>): Revisao => ({
  id: row.id,
  topico_id: row.topico_id,
  disciplinaId: row.disciplina_id,
  conteudo: row.conteudo,
  data_prevista: row.data_prevista,
  status: row.status,
  origem: row.origem,
  dificuldade: row.dificuldade,
  studyPlanId: row.study_plan_id,
});

const mapErro = (row: Tables<'erros'>): CadernoErro => ({
  id: row.id,
  disciplina: row.disciplina,
  disciplinaId: row.disciplina_id,
  assunto: row.assunto,
  descricao: row.descricao,
  topicoId: row.topico_id ?? undefined,
  topicoTitulo: row.topico_titulo ?? undefined,
  resolvido: row.resolvido,
  data: row.data,
  proximaRevisao: row.proxima_revisao ?? undefined,
  nivelDificuldade: row.nivel_dificuldade ?? undefined,
  enunciado: row.enunciado ?? undefined,
  alternativaCorreta: row.alternativa_correta ?? undefined,
  observacoes: row.observacoes ?? undefined,
  studyPlanId: row.study_plan_id,
});

const mapSessaoCiclo = (row: Tables<'ciclo_sessoes'>): SessaoCiclo => ({
  id: row.id,
  ordem: row.ordem,
  disciplina_id: row.disciplina_id,
  tempo_previsto: row.tempo_previsto,
});

const mapCiclo = (row: CicloWithSessions): Ciclo => ({
  id: row.id,
  nome: row.nome,
  sessoes: toArray(row.ciclo_sessoes).sort((a, b) => a.ordem - b.ordem).map(mapSessaoCiclo),
  studyPlanId: row.study_plan_id,
});

const mapFlashcard = (row: Tables<'flashcards'>): Flashcard => ({
  id: row.id,
  topico_id: row.topico_id,
  pergunta: row.pergunta,
  resposta: row.resposta,
  interval: row.interval,
  easeFactor: row.ease_factor,
  dueDate: row.due_date,
  estilo: row.estilo ?? undefined,
});

const mapRedacao = (row: Tables<'redacoes'>): RedacaoCorrigida => ({
  id: row.id,
  texto: row.texto,
  banca: row.banca,
  notaMaxima: row.nota_maxima,
  correcao: (row.correcao as CorrecaoCompleta) ?? null,
  data: row.data,
  tema: row.tema ?? undefined,
  studyPlanId: row.study_plan_id,
});
const mapSimulation = (row: Tables<'simulados'>): Simulation => ({
  id: row.id,
  name: row.name,
  correct: row.correct,
  wrong: row.wrong,
  blank: row.blank ?? undefined,
  durationMinutes: row.duration_minutes,
  notes: row.notes ?? undefined,
  date: row.date,
  edital_id: row.edital_id,
  isCebraspe: row.is_cebraspe ?? undefined,
});

const mapGamificationStatsRow = (row: Tables<'gamification_user_stats'>): GamificationStats => ({
  user_id: row.user_id,
  xp_total: row.xp_total,
  level: row.level,
  current_streak_days: row.current_streak_days,
  best_streak_days: row.best_streak_days,
  unlockedBadgeIds: row.unlocked_badge_ids ?? [],
});

const mapXpLogEntry = (row: Tables<'gamification_xp_log'>): XpLogEntry => ({
  id: row.id,
  user_id: row.user_id,
  event: row.event as XpLogEvent,
  amount: row.amount,
  meta_json: (row.meta_json as Record<string, any>) ?? {},
  created_at: row.created_at,
  tipo_evento: row.tipo_evento,
  multiplicador: row.multiplicador ?? undefined,
});

const mapBadge = (row: Tables<'badges'>): Badge => ({
  id: row.id,
  name: row.name,
  description: row.description,
  icon: row.icon,
  xp: row.xp,
  is_secret: row.is_secret ?? false,
});

const mapFriendship = (row: Tables<'friendships'>): Friendship => ({
  id: row.id,
  user_id_1: row.user_id_1,
  user_id_2: row.user_id_2,
  status: row.status,
  created_at: row.created_at ?? new Date().toISOString(),
});

const realApiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = { ...options.headers };

  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const config: RequestInit = { ...options, headers };

  const response = await fetch(url, config);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro ao comunicar com a API.');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const apiFetch = realApiFetch;

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;
  const authUser = data.user;

  if (!session || !authUser) {
    throw new Error('Falha ao autenticar usuário.');
  }

  const mappedUser: User = {
    id: authUser.id,
    name: (authUser.user_metadata?.name as string | undefined) ?? authUser.email ?? 'Usuário',
    email: authUser.email ?? email,
  };

  return { token: session.access_token, user: mappedUser };
};

export const generateFlashcards = async (
  topicName: string
): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
  return apiFetch('/ai/generate-flashcards', {
    method: 'POST',
    body: JSON.stringify({ topicName }),
  });
};

export const generateFlashcardsFromContent = async (
  disciplinaId: string
): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
  return apiFetch('/ai/generate-flashcards-from-content', {
    method: 'POST',
    body: JSON.stringify({ disciplinaId }),
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
    banca: { type: Type.STRING },
    notaMaxima: { type: Type.NUMBER },
    avaliacaoDetalhada: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          criterio: { type: Type.STRING },
          pontuacao: { type: Type.NUMBER },
          maximo: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
        },
        required: ['criterio', 'pontuacao', 'maximo', 'feedback'],
      },
    },
    comentariosGerais: { type: Type.STRING },
    notaFinal: { type: Type.NUMBER },
    errosDetalhados: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          trecho: { type: Type.STRING },
          tipo: { type: Type.STRING },
          explicacao: { type: Type.STRING },
          sugestao: { type: Type.STRING },
        },
        required: ['trecho', 'tipo', 'explicacao', 'sugestao'],
      },
    },
  },
  required: ['banca', 'notaMaxima', 'avaliacaoDetalhada', 'comentariosGerais', 'notaFinal', 'errosDetalhados'],
};

export const corrigirRedacao = async (
  redacao: string,
  banca: string,
  notaMaxima: number,
  tema?: string
): Promise<CorrecaoCompleta> => {
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
        responseSchema: correcaoSchema,
      },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3).trim();
    }

    return JSON.parse(jsonText) as CorrecaoCompleta;
  } catch (error) {
    console.error('Erro ao corrigir redação com a API Gemini:', error);
    throw new Error('Não foi possível processar a correção da redação. A resposta da IA pode ser inválida.');
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
      text: 'Transcreva o texto contido nesta imagem. Se for uma redação manuscrita, transcreva o texto completo. Se não houver texto legível, retorne uma string vazia.',
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text;
  } catch (error) {
    console.error('Erro ao extrair texto com a API Gemini:', error);
    throw new Error('Não foi possível extrair o texto da imagem.');
  }
};

export const gerarPlanoDeEstudosIA = async (
  objetivo: string,
  horasSemanais: number,
  disciplinasComTopicos: DisciplinaParaIA[]
): Promise<TrilhaSemanalData> => {
  return apiFetch('/ai/gerar-plano-estudos', {
    method: 'POST',
    body: JSON.stringify({ objetivo, horasSemanais, disciplinasComTopicos }),
  });
};

export const sugerirCicloIA = async (
  disciplinas: { id: string; nome: string; dificuldade: string }[],
  tempoTotalMinutos: number
): Promise<{ disciplina_id: string; tempo_previsto: number }[]> => {
  const prompt = `
        Como um especialista em planejamento de estudos, crie uma sugestão de distribuição de tempo para um ciclo de estudos.
        O tempo total para uma rotação completa do ciclo é de ${tempoTotalMinutos} minutos.
        As matérias e suas dificuldades percebidas pelo estudante são:
        ${disciplinas.map((d) => `- ${d.nome} (ID: ${d.id}, Dificuldade: ${d.dificuldade})`).join('\n')}

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
      required: ['disciplina_id', 'tempo_previsto'],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    let jsonText = response.text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7, -3).trim();
    }

    const sugestao = JSON.parse(jsonText) as { disciplina_id: string; tempo_previsto: number }[];
    return sugestao.map((s) => ({ ...s, tempo_previsto: s.tempo_previsto * 60 }));
  } catch (error) {
    console.error('Erro ao sugerir ciclo com a API Gemini:', error);
    throw new Error('Não foi possível gerar a sugestão de ciclo.');
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
    console.error('Erro ao gerar mensagem motivacional com a API Gemini:', error);
    return 'Continue focado nos seus objetivos. Cada passo que você dá hoje te aproxima da sua aprovação!';
  }
};

const fetchDisciplinaById = async (id: string): Promise<Disciplina> => {
  const row = await selectFrom('disciplinas', {
    select: '*, topicos(*)',
    single: true,
    builder: (query) => query.eq('id', id),
  });

  if (!row) {
    throw new Error('Disciplina não encontrada.');
  }

  return mapDisciplina(row as DisciplinaWithTopicos);
};

const fetchCicloById = async (id: string): Promise<Ciclo> => {
  const row = await selectFrom('ciclos', {
    select: '*, ciclo_sessoes(*)',
    single: true,
    builder: (query) => query.eq('id', id),
  });

  if (!row) {
    throw new Error('Ciclo não encontrado.');
  }

  return mapCiclo(row as CicloWithSessions);
};
export const getGamificationStats = async (userId: string): Promise<GamificationStats | null> => {
  const row = await selectFrom('gamification_user_stats', {
    single: true,
    builder: (query) => query.eq('user_id', userId),
  });

  if (!row) {
    return null;
  }

  return mapGamificationStatsRow(row as Tables<'gamification_user_stats'>);
};

export const updateGamificationStats = async (
  userId: string,
  data: Partial<GamificationStats>
): Promise<GamificationStats> => {
  const payload = {
    user_id: userId,
    xp_total: data.xp_total,
    level: data.level,
    current_streak_days: data.current_streak_days,
    best_streak_days: data.best_streak_days,
    unlocked_badge_ids: data.unlockedBadgeIds,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('gamification_user_stats')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapGamificationStatsRow(updated as Tables<'gamification_user_stats'>);
};

export const logXpEvent = async (
  userId: string,
  event: XpLogEvent,
  amount: number,
  meta: Record<string, any> = {},
  tipo_evento: 'ativo' | 'manual',
  multiplicador: number
): Promise<XpLogEntry> => {
  const entry = await insertInto('gamification_xp_log', {
    user_id: userId,
    event,
    amount,
    meta_json: meta,
    created_at: new Date().toISOString(),
    tipo_evento,
    multiplicador,
  });

  try {
    const currentStats = await getGamificationStats(userId);
    if (currentStats) {
      await updateGamificationStats(userId, {
        xp_total: currentStats.xp_total + amount,
      });
    } else {
      await updateGamificationStats(userId, {
        xp_total: amount,
        level: 1,
        current_streak_days: tipo_evento === 'ativo' ? 1 : 0,
        best_streak_days: tipo_evento === 'ativo' ? 1 : 0,
        unlockedBadgeIds: [],
      });
    }
  } catch (error) {
    console.error('Falha ao atualizar estatísticas após log de XP:', error);
  }

  return mapXpLogEntry(entry as Tables<'gamification_xp_log'>);
};

export const getBadges = async (): Promise<Badge[]> => {
  const rows = await selectFrom('badges');
  return toArray(rows as Tables<'badges'>[] | null).map(mapBadge);
};

export const getXpLog = async (userId: string): Promise<XpLogEntry[]> => {
  const rows = await selectFrom('gamification_xp_log', {
    builder: (query) => query.eq('user_id', userId).order('created_at', { ascending: false }),
  });

  return toArray(rows as Tables<'gamification_xp_log'>[] | null).map(mapXpLogEntry);
};

const fetchUsersMap = async (userIds: string[]): Promise<Map<string, User>> => {
  if (!userIds.length) {
    return new Map();
  }

  const rows = await selectFrom('users', {
    builder: (query) => query.in('id', userIds),
  });

  const map = new Map<string, User>();
  toArray(rows as Tables<'users'>[] | null).forEach((row) => {
    map.set(row.id, mapUser(row));
  });
  return map;
};

const fetchStatsMap = async (userIds: string[]): Promise<Map<string, GamificationStats>> => {
  if (!userIds.length) {
    return new Map();
  }

  const rows = await selectFrom('gamification_user_stats', {
    builder: (query) => query.in('user_id', userIds),
  });

  const map = new Map<string, GamificationStats>();
  toArray(rows as Tables<'gamification_user_stats'>[] | null).forEach((row) => {
    map.set(row.user_id, mapGamificationStatsRow(row));
  });
  return map;
};

export const getWeeklyRanking = async (userId: string) => {
  const since = subDays(new Date(), 7).toISOString();

  const logs = await selectFrom('gamification_xp_log', {
    builder: (query) => query.gte('created_at', since),
  });

  const xpByUser = new Map<string, number>();
  toArray(logs as Tables<'gamification_xp_log'>[] | null).forEach((log) => {
    xpByUser.set(log.user_id, (xpByUser.get(log.user_id) || 0) + log.amount);
  });

  if (!xpByUser.has(userId)) {
    xpByUser.set(userId, 0);
  }

  const userIds = Array.from(xpByUser.keys());
  const [usersMap, statsMap] = await Promise.all([
    fetchUsersMap(userIds),
    fetchStatsMap(userIds),
  ]);

  const fullRanking = userIds
    .map((id) => ({
      user_id: id,
      name: usersMap.get(id)?.name ?? 'Usuário',
      level: statsMap.get(id)?.level ?? 1,
      weekly_xp: xpByUser.get(id) || 0,
    }))
    .sort((a, b) => b.weekly_xp - a.weekly_xp);

  const ranking = fullRanking.slice(0, 10);
  const rankIndex = fullRanking.findIndex((entry) => entry.user_id === userId);
  const currentUserRank =
    rankIndex >= 0
      ? {
          ...fullRanking[rankIndex],
          rank: rankIndex + 1,
        }
      : null;

  return { ranking, currentUserRank };
};

export const getFriends = async (userId: string): Promise<User[]> => {
  const rows = await selectFrom('friendships', {
    builder: (query) => query.or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`).eq('status', 'accepted'),
  });

  const friendships = toArray(rows as Tables<'friendships'>[] | null).map(mapFriendship);
  const friendIds = friendships.map((friendship) =>
    friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1
  );

  if (!friendIds.length) {
    return [];
  }

  const users = await selectFrom('users', {
    builder: (query) => query.in('id', friendIds),
  });

  return toArray(users as Tables<'users'>[] | null).map(mapUser);
};

export const getFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  const rows = await selectFrom('friendships', {
    builder: (query) => query.eq('user_id_2', userId).eq('status', 'pending'),
  });

  const requests = toArray(rows as Tables<'friendships'>[] | null);

  if (!requests.length) {
    return [];
  }

  const requesterIds = requests.map((request) => request.user_id_1);
  const [usersMap, statsMap] = await Promise.all([
    fetchUsersMap(requesterIds),
    fetchStatsMap(requesterIds),
  ]);

  return requests.map((request) => ({
    friendship_id: request.id,
    requester_id: request.user_id_1,
    requester_name: usersMap.get(request.user_id_1)?.name ?? 'Usuário',
    requester_level: statsMap.get(request.user_id_1)?.level ?? 1,
  }));
};

export const searchUsers = async (query: string, currentUserId: string): Promise<User[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const relationships = await selectFrom('friendships', {
    builder: (q) => q.or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`),
  });

  const excludedIds = new Set<string>([currentUserId]);
  toArray(relationships as Tables<'friendships'>[] | null).forEach((friendship) => {
    excludedIds.add(friendship.user_id_1 === currentUserId ? friendship.user_id_2 : friendship.user_id_1);
  });

  const rows = await selectFrom('users', {
    builder: (q) => q.ilike('name', `%${trimmed}%`).limit(20),
  });

  return toArray(rows as Tables<'users'>[] | null)
    .filter((row) => !excludedIds.has(row.id))
    .map(mapUser);
};

export const sendFriendRequest = async (requesterId: string, receiverId: string) => {
  await insertInto(
    'friendships',
    {
      user_id_1: requesterId,
      user_id_2: receiverId,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
    { single: true }
  );
};

export const acceptFriendRequest = async (friendshipId: string) => {
  await updateRow(
    'friendships',
    { id: friendshipId },
    {
      status: 'accepted',
    }
  );
};

export const declineFriendRequest = async (friendshipId: string) => {
  await updateRow(
    'friendships',
    { id: friendshipId },
    {
      status: 'declined',
    }
  );
};

export const getFriendsRanking = async (userId: string) => {
  const friendships = await selectFrom('friendships', {
    builder: (query) => query.or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`).eq('status', 'accepted'),
  });

  const friendIds = toArray(friendships as Tables<'friendships'>[] | null).map((friendship) =>
    friendship.user_id_1 === userId ? friendship.user_id_2 : friendship.user_id_1
  );
  const relevantIds = Array.from(new Set([...friendIds, userId]));

  if (!relevantIds.length) {
    return { ranking: [], currentUserRank: null };
  }

  const since = subDays(new Date(), 7).toISOString();
  const logs = await selectFrom('gamification_xp_log', {
    builder: (query) => query.in('user_id', relevantIds).gte('created_at', since),
  });

  const xpByUser = new Map<string, number>();
  toArray(logs as Tables<'gamification_xp_log'>[] | null).forEach((log) => {
    xpByUser.set(log.user_id, (xpByUser.get(log.user_id) || 0) + log.amount);
  });

  relevantIds.forEach((id) => {
    if (!xpByUser.has(id)) {
      xpByUser.set(id, 0);
    }
  });

  const [usersMap, statsMap] = await Promise.all([
    fetchUsersMap(relevantIds),
    fetchStatsMap(relevantIds),
  ]);

  const fullRanking = relevantIds
    .map((id) => ({
      user_id: id,
      name: usersMap.get(id)?.name ?? 'Usuário',
      level: statsMap.get(id)?.level ?? 1,
      weekly_xp: xpByUser.get(id) || 0,
    }))
    .sort((a, b) => b.weekly_xp - a.weekly_xp);

  const rankIndex = fullRanking.findIndex((entry) => entry.user_id === userId);
  const currentUserRank =
    rankIndex >= 0
      ? {
          ...fullRanking[rankIndex],
          rank: rankIndex + 1,
        }
      : null;

  return { ranking: fullRanking, currentUserRank };
};
export const getEditais = async (): Promise<StudyPlan[]> => {
  const rows = await selectFrom('editais');
  return toArray(rows as Tables<'editais'>[] | null).map(mapStudyPlan);
};

export const createEdital = async (data: Omit<StudyPlan, 'id'>): Promise<StudyPlan> => {
  const edital = await insertInto('editais', {
    nome: data.nome,
    descricao: data.descricao ?? '',
    data_alvo: data.data_alvo ?? null,
    banca: data.banca ?? null,
    orgao: data.orgao ?? null,
  });

  return mapStudyPlan(edital as Tables<'editais'>);
};

export const updateEditalApi = async (id: string, data: Partial<StudyPlan>): Promise<StudyPlan> => {
  await updateRow(
    'editais',
    { id },
    {
      nome: data.nome ?? undefined,
      descricao: data.descricao ?? undefined,
      data_alvo: data.data_alvo ?? undefined,
      banca: data.banca ?? undefined,
      orgao: data.orgao ?? undefined,
    }
  );

  const updated = await selectFrom('editais', {
    single: true,
    builder: (query) => query.eq('id', id),
  });

  if (!updated) {
    throw new Error('Edital não encontrado.');
  }

  return mapStudyPlan(updated as Tables<'editais'>);
};

export const deleteEdital = async (id: string) => {
  const disciplinas = await selectFrom('disciplinas', {
    select: 'id',
    builder: (query) => query.eq('study_plan_id', id),
  });

  const disciplinaIds = toArray(disciplinas as Tables<'disciplinas'>[] | null).map((disciplina) => disciplina.id);
  if (disciplinaIds.length) {
    await deleteFrom('topicos', (query) => query.in('disciplina_id', disciplinaIds));
    await deleteFrom('ciclo_sessoes', (query) => query.in('disciplina_id', disciplinaIds));
    await deleteFrom('revisoes', (query) => query.in('disciplina_id', disciplinaIds));
    await deleteFrom('erros', (query) => query.in('disciplina_id', disciplinaIds));
  }

  const ciclos = await selectFrom('ciclos', {
    select: 'id',
    builder: (query) => query.eq('study_plan_id', id),
  });

  const cicloIds = toArray(ciclos as Tables<'ciclos'>[] | null).map((ciclo) => ciclo.id);
  if (cicloIds.length) {
    await deleteFrom('ciclo_sessoes', (query) => query.in('ciclo_id', cicloIds));
    await deleteFrom('ciclos', (query) => query.in('id', cicloIds));
  }

  await deleteFrom('sessoes', (query) => query.eq('study_plan_id', id));
  await deleteFrom('redacoes', (query) => query.eq('study_plan_id', id));
  await deleteFrom('simulados', (query) => query.eq('edital_id', id));
  await deleteFrom('disciplinas', (query) => query.eq('study_plan_id', id));
  await deleteFrom('editais', { id });
};

export const getDisciplinas = async (editalId: string): Promise<Disciplina[]> => {
  const rows = await selectFrom('disciplinas', {
    select: '*, topicos(*)',
    builder: (query) => query.eq('study_plan_id', editalId).order('nome', { ascending: true }),
  });

  return toArray(rows as DisciplinaWithTopicos[] | null).map(mapDisciplina);
};

export const createDisciplina = async (
  editalId: string,
  data: Omit<Disciplina, 'id' | 'topicos' | 'studyPlanId'>
): Promise<Disciplina> => {
  const disciplina = await insertInto('disciplinas', {
    nome: data.nome,
    anotacoes: data.anotacoes ?? '',
    progresso: data.progresso ?? 0,
    study_plan_id: editalId,
  });

  return mapDisciplina({ ...(disciplina as Tables<'disciplinas'>), topicos: [] });
};

export const updateDisciplinaApi = async (id: string, data: Partial<Disciplina>): Promise<Disciplina> => {
  const payload: Partial<Tables<'disciplinas'>> = {};
  if (data.nome !== undefined) payload.nome = data.nome;
  if (data.anotacoes !== undefined) payload.anotacoes = data.anotacoes;
  if (data.progresso !== undefined) payload.progresso = data.progresso;
  if (data.studyPlanId !== undefined) payload.study_plan_id = data.studyPlanId;

  if (Object.keys(payload).length) {
    await updateRow('disciplinas', { id }, payload as Tables<'disciplinas'>);
  }

  return fetchDisciplinaById(id);
};

export const deleteDisciplina = async (id: string) => {
  await deleteFrom('topicos', (query) => query.eq('disciplina_id', id));
  await deleteFrom('ciclo_sessoes', (query) => query.eq('disciplina_id', id));
  await deleteFrom('revisoes', (query) => query.eq('disciplina_id', id));
  await deleteFrom('erros', (query) => query.eq('disciplina_id', id));
  await deleteFrom('disciplinas', { id });
};

export const createTopico = async (
  disciplinaId: string,
  data: Omit<Topico, 'id'>
): Promise<Topico> => {
  const topico = await insertInto('topicos', {
    disciplina_id: disciplinaId,
    titulo: data.titulo,
    concluido: data.concluido ?? false,
    nivel_dificuldade: data.nivelDificuldade,
    ultima_revisao: data.ultimaRevisao ?? null,
    proxima_revisao: data.proximaRevisao ?? null,
  });

  return mapTopico(topico as Tables<'topicos'>);
};

export const updateTopicoApi = async (id: string, data: Partial<Topico>): Promise<Topico> => {
  const updated = await updateRow('topicos', { id }, {
    titulo: data.titulo ?? undefined,
    concluido: data.concluido ?? undefined,
    nivel_dificuldade: data.nivelDificuldade ?? undefined,
    ultima_revisao: data.ultimaRevisao ?? undefined,
    proxima_revisao: data.proximaRevisao ?? undefined,
  });

  return mapTopico(updated as Tables<'topicos'>);
};

export const deleteTopico = async (id: string) => {
  await deleteFrom('flashcards', (query) => query.eq('topico_id', id));
  await deleteFrom('revisoes', (query) => query.eq('topico_id', id));
  await deleteFrom('topicos', { id });
};

export const getSessoes = async (editalId: string): Promise<SessaoEstudo[]> => {
  const rows = await selectFrom('sessoes', {
    builder: (query) => query.eq('study_plan_id', editalId).order('data_estudo', { ascending: false }),
  });

  return toArray(rows as Tables<'sessoes'>[] | null).map(mapSessaoEstudo);
};

export const createSessao = async (
  editalId: string,
  data: Omit<SessaoEstudo, 'id' | 'studyPlanId'>
): Promise<SessaoEstudo> => {
  const sessao = await insertInto('sessoes', {
    study_plan_id: editalId,
    topico_id: data.topico_id,
    tempo_estudado: data.tempo_estudado,
    data_estudo: data.data_estudo,
    comentarios: data.comentarios ?? null,
  });

  return mapSessaoEstudo(sessao as Tables<'sessoes'>);
};

export const updateSessaoApi = async (id: string, data: Partial<SessaoEstudo>): Promise<SessaoEstudo> => {
  const updated = await updateRow('sessoes', { id }, {
    topico_id: data.topico_id ?? undefined,
    tempo_estudado: data.tempo_estudado ?? undefined,
    data_estudo: data.data_estudo ?? undefined,
    comentarios: data.comentarios ?? undefined,
  });

  return mapSessaoEstudo(updated as Tables<'sessoes'>);
};

export const deleteSessao = async (id: string) => {
  await deleteFrom('sessoes', { id });
};

export const getRevisoes = async (editalId: string): Promise<Revisao[]> => {
  const rows = await selectFrom('revisoes', {
    builder: (query) => query.eq('study_plan_id', editalId).order('data_prevista', { ascending: true }),
  });

  return toArray(rows as Tables<'revisoes'>[] | null).map(mapRevisao);
};

export const createRevisao = async (
  editalId: string,
  data: Omit<Revisao, 'id' | 'studyPlanId'>
): Promise<Revisao> => {
  const revisao = await insertInto('revisoes', {
    study_plan_id: editalId,
    topico_id: data.topico_id,
    disciplina_id: data.disciplinaId,
    conteudo: data.conteudo,
    data_prevista: data.data_prevista,
    status: data.status,
    origem: data.origem,
    dificuldade: data.dificuldade,
  });

  return mapRevisao(revisao as Tables<'revisoes'>);
};

export const updateRevisaoApi = async (id: string, data: Partial<Revisao>): Promise<Revisao> => {
  const updated = await updateRow('revisoes', { id }, {
    topico_id: data.topico_id ?? undefined,
    disciplina_id: data.disciplinaId ?? undefined,
    conteudo: data.conteudo ?? undefined,
    data_prevista: data.data_prevista ?? undefined,
    status: data.status ?? undefined,
    origem: data.origem ?? undefined,
    dificuldade: data.dificuldade ?? undefined,
  });

  return mapRevisao(updated as Tables<'revisoes'>);
};

export const deleteRevisao = async (id: string) => {
  await deleteFrom('revisoes', { id });
};

export const getErros = async (editalId: string): Promise<CadernoErro[]> => {
  const rows = await selectFrom('erros', {
    builder: (query) => query.eq('study_plan_id', editalId).order('data', { ascending: false }),
  });

  return toArray(rows as Tables<'erros'>[] | null).map(mapErro);
};

export const createErro = async (
  editalId: string,
  data: Omit<CadernoErro, 'id' | 'studyPlanId'>
): Promise<CadernoErro> => {
  const erro = await insertInto('erros', {
    study_plan_id: editalId,
    disciplina: data.disciplina,
    disciplina_id: data.disciplinaId,
    assunto: data.assunto,
    descricao: data.descricao,
    topico_id: data.topicoId ?? null,
    topico_titulo: data.topicoTitulo ?? null,
    resolvido: data.resolvido,
    data: data.data,
    proxima_revisao: data.proximaRevisao ?? null,
    nivel_dificuldade: data.nivelDificuldade ?? null,
    enunciado: data.enunciado ?? null,
    alternativa_correta: data.alternativaCorreta ?? null,
    observacoes: data.observacoes ?? null,
  });

  return mapErro(erro as Tables<'erros'>);
};

export const updateErroApi = async (id: string, data: Partial<CadernoErro>): Promise<CadernoErro> => {
  const updated = await updateRow('erros', { id }, {
    disciplina: data.disciplina ?? undefined,
    disciplina_id: data.disciplinaId ?? undefined,
    assunto: data.assunto ?? undefined,
    descricao: data.descricao ?? undefined,
    topico_id: data.topicoId ?? undefined,
    topico_titulo: data.topicoTitulo ?? undefined,
    resolvido: data.resolvido ?? undefined,
    data: data.data ?? undefined,
    proxima_revisao: data.proximaRevisao ?? undefined,
    nivel_dificuldade: data.nivelDificuldade ?? undefined,
    enunciado: data.enunciado ?? undefined,
    alternativa_correta: data.alternativaCorreta ?? undefined,
    observacoes: data.observacoes ?? undefined,
  });

  return mapErro(updated as Tables<'erros'>);
};

export const deleteErro = async (id: string) => {
  await deleteFrom('erros', { id });
};

export const getCiclos = async (editalId: string): Promise<Ciclo[]> => {
  const rows = await selectFrom('ciclos', {
    select: '*, ciclo_sessoes(*)',
    builder: (query) => query.eq('study_plan_id', editalId).order('created_at', { ascending: true }),
  });

  return toArray(rows as CicloWithSessions[] | null).map(mapCiclo);
};

export const createCiclo = async (
  editalId: string,
  data: Omit<Ciclo, 'id' | 'studyPlanId'>
): Promise<Ciclo> => {
  const ciclo = await insertInto('ciclos', {
    nome: data.nome,
    study_plan_id: editalId,
  });

  const cicloId = (ciclo as Tables<'ciclos'>).id;
  const sessoes = data.sessoes ?? [];

  if (sessoes.length) {
    await insertInto(
      'ciclo_sessoes',
      sessoes.map((sessao) => ({
        ciclo_id: cicloId,
        disciplina_id: sessao.disciplina_id,
        tempo_previsto: sessao.tempo_previsto,
        ordem: sessao.ordem,
      })),
      { single: false }
    );
  }

  return fetchCicloById(cicloId);
};

export const updateCicloApi = async (id: string, data: Partial<Ciclo>): Promise<Ciclo> => {
  if (data.nome !== undefined) {
    await updateRow('ciclos', { id }, { nome: data.nome });
  }

  if (data.sessoes) {
    const existingSessions = await selectFrom('ciclo_sessoes', {
      builder: (query) => query.eq('ciclo_id', id),
    });

    const existingIds = new Set(toArray(existingSessions as Tables<'ciclo_sessoes'>[] | null).map((sessao) => sessao.id));
    const keepIds = new Set<string>();

    for (const sessao of data.sessoes) {
      if (sessao.id && existingIds.has(sessao.id) && !sessao.id.startsWith('sessao-')) {
        await updateRow('ciclo_sessoes', { id: sessao.id }, {
          disciplina_id: sessao.disciplina_id,
          tempo_previsto: sessao.tempo_previsto,
          ordem: sessao.ordem,
        });
        keepIds.add(sessao.id);
      } else {
        const inserted = await insertInto(
          'ciclo_sessoes',
          {
            ciclo_id: id,
            disciplina_id: sessao.disciplina_id,
            tempo_previsto: sessao.tempo_previsto,
            ordem: sessao.ordem,
          },
          { single: true }
        );
        keepIds.add((inserted as Tables<'ciclo_sessoes'>).id);
      }
    }

    const idsToDelete = Array.from(existingIds).filter((existingId) => !keepIds.has(existingId));
    if (idsToDelete.length) {
      await deleteFrom('ciclo_sessoes', (query) => query.in('id', idsToDelete));
    }
  }

  return fetchCicloById(id);
};

export const deleteCiclo = async (id: string) => {
  await deleteFrom('ciclo_sessoes', (query) => query.eq('ciclo_id', id));
  await deleteFrom('ciclos', { id });
};

export const getFlashcards = async (topicoId: string): Promise<Flashcard[]> => {
  const rows = await selectFrom('flashcards', {
    builder: (query) => query.eq('topico_id', topicoId).order('created_at', { ascending: true }),
  });

  return toArray(rows as Tables<'flashcards'>[] | null).map(mapFlashcard);
};

export const createFlashcards = async (
  topicoId: string,
  data: { flashcards: Omit<Flashcard, 'id' | 'topico_id'>[] }
): Promise<Flashcard[]> => {
  const payload = data.flashcards.map((flashcard) => ({
    topico_id: topicoId,
    pergunta: flashcard.pergunta,
    resposta: flashcard.resposta,
    interval: flashcard.interval ?? 1,
    ease_factor: flashcard.easeFactor ?? 2.5,
    due_date: flashcard.dueDate ?? new Date().toISOString(),
    estilo: flashcard.estilo ?? null,
  }));

  const inserted = await insertInto('flashcards', payload, { single: false });
  return toArray(inserted as Tables<'flashcards'>[] | null).map(mapFlashcard);
};

export const updateFlashcardApi = async (id: string, data: Partial<Flashcard>): Promise<Flashcard> => {
  const updated = await updateRow('flashcards', { id }, {
    pergunta: data.pergunta ?? undefined,
    resposta: data.resposta ?? undefined,
    interval: data.interval ?? undefined,
    ease_factor: data.easeFactor ?? undefined,
    due_date: data.dueDate ?? undefined,
    estilo: data.estilo ?? undefined,
  });

  return mapFlashcard(updated as Tables<'flashcards'>);
};

export const deleteFlashcard = async (id: string) => {
  await deleteFrom('flashcards', { id });
};

export const getRedacoes = async (editalId: string): Promise<RedacaoCorrigida[]> => {
  const rows = await selectFrom('redacoes', {
    builder: (query) => query.eq('study_plan_id', editalId).order('data', { ascending: false }),
  });

  return toArray(rows as Tables<'redacoes'>[] | null).map(mapRedacao);
};

export const createRedacao = async (
  editalId: string,
  data: Omit<RedacaoCorrigida, 'id' | 'studyPlanId'>
): Promise<RedacaoCorrigida> => {
  const redacao = await insertInto('redacoes', {
    study_plan_id: editalId,
    texto: data.texto,
    banca: data.banca,
    nota_maxima: data.notaMaxima,
    correcao: data.correcao ?? null,
    data: data.data,
    tema: data.tema ?? null,
  });

  return mapRedacao(redacao as Tables<'redacoes'>);
};

export const getSimulados = async (editalId: string): Promise<Simulation[]> => {
  const rows = await selectFrom('simulados', {
    builder: (query) => query.eq('edital_id', editalId).order('date', { ascending: false }),
  });

  return toArray(rows as Tables<'simulados'>[] | null).map(mapSimulation);
};

export const createSimulado = async (
  editalId: string,
  data: Omit<Simulation, 'id' | 'edital_id'>
): Promise<Simulation> => {
  const simulado = await insertInto('simulados', {
    edital_id: editalId,
    name: data.name,
    correct: data.correct,
    wrong: data.wrong,
    blank: data.blank ?? null,
    duration_minutes: data.durationMinutes,
    notes: data.notes ?? null,
    date: data.date,
    is_cebraspe: data.isCebraspe ?? null,
  });

  return mapSimulation(simulado as Tables<'simulados'>);
};

export const updateSimuladoApi = async (id: string, data: Partial<Simulation>): Promise<Simulation> => {
  const updated = await updateRow('simulados', { id }, {
    name: data.name ?? undefined,
    correct: data.correct ?? undefined,
    wrong: data.wrong ?? undefined,
    blank: data.blank ?? undefined,
    duration_minutes: data.durationMinutes ?? undefined,
    notes: data.notes ?? undefined,
    date: data.date ?? undefined,
    edital_id: data.edital_id ?? undefined,
    is_cebraspe: data.isCebraspe ?? undefined,
  });

  return mapSimulation(updated as Tables<'simulados'>);
};

export const deleteSimulado = async (id: string) => {
  await deleteFrom('simulados', { id });
};
