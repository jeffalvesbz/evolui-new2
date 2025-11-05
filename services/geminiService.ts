

import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, XpLogEvent, XpLogEntry, GamificationStats, DisciplinaParaIA, Friendship, FriendRequest, NivelDificuldade, NotasPesosEntrada } from '../types';
import { TrilhaSemanalData } from '../stores/useEstudosStore';
import { Simulation } from '../stores/useStudyStore';
import { subDays } from 'date-fns';
import { WeeklyRankingData } from '../stores/useGamificationStore';

// Get API key from environment or use empty string (will fail gracefully)
const getApiKey = () => {
  // Try Vite env variable first (VITE_ prefix required for client-side access)
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  // Fallback to process.env (defined in vite.config.ts)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  // Return empty string if not found (will cause error when trying to use AI features)
  return '';
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

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
        banca: { type: Type.STRING },
        notaMaxima: { type: Type.NUMBER },
        avaliacaoGeral: { type: Type.STRING },
        avaliacaoDetalhada: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { 
                    criterio: { type: Type.STRING }, 
                    pontuacao: { type: Type.NUMBER }, 
                    maximo: { type: Type.NUMBER },
                    peso: { type: Type.NUMBER },
                    feedback: { type: Type.STRING } 
                } 
            } 
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
                    sugestao: { type: Type.STRING } 
                } 
            } 
        },
        textoCorrigido: { type: Type.STRING },
        sinteseFinal: { type: Type.STRING }
    }
};

export const corrigirRedacao = async (
    redacao: string, 
    banca: string, 
    notaMaxima: number, 
    tema?: string,
    notasPesos?: NotasPesosEntrada
): Promise<CorrecaoCompleta> => {
    if (!ai) {
        throw new Error('API Key do Gemini não configurada. Configure a variável GEMINI_API_KEY no arquivo .env');
    }

    // Determinar critérios e notas/pesos baseado na entrada do usuário
    const criteriosEntrada: Array<{ nome: string; nota: number; peso: number; maximo: number }> = [];
    
    if (notasPesos) {
        if (notasPesos.conteudo) criteriosEntrada.push({ nome: 'Conteúdo / Argumentação', ...notasPesos.conteudo });
        if (notasPesos.estrutura) criteriosEntrada.push({ nome: 'Estrutura / Coesão', ...notasPesos.estrutura });
        if (notasPesos.linguagem) criteriosEntrada.push({ nome: 'Linguagem / Norma Culta', ...notasPesos.linguagem });
        if (notasPesos.argumentacao) criteriosEntrada.push({ nome: 'Argumentação', ...notasPesos.argumentacao });
        if (notasPesos.coesao) criteriosEntrada.push({ nome: 'Coesão', ...notasPesos.coesao });
    }

    // Se não há notas/pesos definidos, criar critérios padrão baseados na banca
    // Neste caso, a IA calculará as notas
    let notaFinalCalculada = 0;
    if (criteriosEntrada.length === 0) {
        // Sem notas/pesos definidos, a IA calculará tudo
        notaFinalCalculada = 0; // Será calculado pela IA
    } else {
        // Calcular nota final baseada nos pesos e notas definidos pelo usuário
        notaFinalCalculada = criteriosEntrada.reduce((sum, c) => sum + (c.nota * c.peso), 0);
    }

    // Estilos de avaliação por banca
    const estiloBanca: Record<string, string> = {
        'CESPE': 'Estilo técnico e objetivo; correção analítica. Valorize clareza, concisão e densidade argumentativa. Penalize repetições e desvios da norma culta. Use linguagem impessoal e avaliativa.',
        'Cebraspe': 'Estilo técnico e objetivo; correção analítica. Valorize clareza, concisão e densidade argumentativa. Penalize repetições e desvios da norma culta. Use linguagem impessoal e avaliativa.',
        'FGV': 'Estilo crítico e interpretativo. Valorize reflexão social e originalidade argumentativa. Penalize superficialidade ou discurso genérico. Tom analítico com foco na profundidade das ideias.',
        'FCC': 'Estilo formalista e técnico. Valorize coesão, paralelismo sintático e precisão gramatical. Penalize erros de concordância, ambiguidades e pobreza vocabular. Tom metódico e avaliativo.',
        'VUNESP': 'Estilo direto e objetivo. Valorize clareza e adequação ao tema. Penalize erros básicos e conclusões vagas. Tom de parecer didático e equilibrado.',
        'ENEM': 'Estilo pedagógico e detalhado, com 5 competências. Linguagem acessível, mas técnica, com foco em autodesenvolvimento. Atenção especial à proposta de intervenção.',
        'IBFC': 'Estilo neutro e padronizado. Valorize cumprimento integral da proposta e linguagem formal. Penalize repetição de ideias e argumentação rasa. Feedback direto, com observações pontuais.',
        'QUADRIX': 'Estilo neutro e padronizado. Valorize cumprimento integral da proposta e linguagem formal. Penalize repetição de ideias e argumentação rasa. Feedback direto, com observações pontuais.',
        'IDECAN': 'Estilo neutro e padronizado. Valorize cumprimento integral da proposta e linguagem formal. Penalize repetição de ideias e argumentação rasa. Feedback direto, com observações pontuais.',
        'AOCP': 'Estilo neutro e padronizado. Valorize cumprimento integral da proposta e linguagem formal. Penalize repetição de ideias e argumentação rasa. Feedback direto, com observações pontuais.'
    };

    const estilo = estiloBanca[banca] || 'Siga os critérios padrão da banca, valorizando correção, coerência e adequação ao tema.';

    // Construir seção de critérios para o prompt
    const secoesCriterios = criteriosEntrada.length > 0
        ? criteriosEntrada.map(c => 
            `- ${c.nome}: Nota atribuída ${c.nota.toFixed(1)} / ${c.maximo.toFixed(1)} (peso: ${(c.peso * 100).toFixed(0)}%)`
        ).join('\n')
        : `A IA deve calcular as notas para os critérios padrão da banca ${banca}.`;

    const prompt = `Você é um corretor especializado em redações de concursos públicos, com conhecimento profundo dos critérios de avaliação da banca "${banca}".

FUNÇÃO: ${criteriosEntrada.length > 0 
    ? 'Gerar uma correção textual completa com análise técnica e devolutiva pedagógica, INTERPRETANDO E EXPLICANDO as notas já atribuídas pelo avaliador. Você NÃO atribui notas, apenas explica e justifica as notas dadas.'
    : 'Gerar uma correção textual completa com análise técnica e devolutiva pedagógica, ATRIBUINDO NOTAS para cada critério baseado na avaliação do texto. Calcule a nota final somando as pontuações dos critérios.'
}

╔════════════════════════════════════════════════════════════════╗
║  DADOS DA AVALIAÇÃO (JÁ DEFINIDOS PELO AVALIADOR)            ║
╚════════════════════════════════════════════════════════════════╝

BANCA: ${banca}
TEMA: ${tema || 'Não especificado'}
NOTA MÁXIMA: ${notaMaxima} pontos

CRITÉRIOS E NOTAS ATRIBUÍDAS:
${secoesCriterios}

${criteriosEntrada.length > 0 ? `NOTA FINAL CALCULADA: ${notaFinalCalculada.toFixed(1)} / ${notaMaxima}` : 'A IA deve calcular a nota final baseada na avaliação dos critérios.'}

${notasPesos?.observacaoAvaliador ? `OBSERVAÇÃO DO AVALIADOR: ${notasPesos.observacaoAvaliador}\n` : ''}

╔════════════════════════════════════════════════════════════════╗
║  INSTRUÇÕES PARA A CORREÇÃO                                    ║
╚════════════════════════════════════════════════════════════════╝

1. USE O ESTILO DE CORREÇÃO DA BANCA INDICADA:
   ${estilo}

2. INTERPRETE E EXPLIQUE AS NOTAS DADAS:
   - Justifique por que o texto MERECE a nota informada em cada critério
   - Identifique os elementos que justificam essa pontuação (ou poderiam elevá-la)
   - Explique o que precisa ser melhorado em cada eixo para atingir pontuação máxima
   - Seja técnico e objetivo, usando linguagem de avaliador oficial

3. MANTENHA TOM TÉCNICO DE CORRETOR:
   - Linguagem formal e objetiva, mas pedagógica e construtiva
   - Use termos e critérios característicos da banca ${banca}
   - Evite subjetividade excessiva; seja preciso e fundamentado

4. APRESENTE O PARECER FINAL EM 6 PARTES:

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 1️⃣ AVALIAÇÃO GERAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Síntese global do desempenho, apontando se o texto cumpre o tema e o formato exigido pela banca ${banca}. 
   ${criteriosEntrada.length > 0 ? `Contextualize a nota final calculada (${notaFinalCalculada.toFixed(1)}/${notaMaxima}) em relação ao desempenho geral.` : 'Apresente uma visão geral do desempenho antes da análise detalhada.'}

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 2️⃣ ANÁLISE POR CRITÉRIO ${criteriosEntrada.length > 0 ? '(com base nas notas atribuídas)' : '(avaliar e atribuir notas)'}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ${criteriosEntrada.length > 0 
    ? `Para cada critério abaixo, forneça:
   - Justificativa técnica da nota atribuída
   - Elementos que justificam a pontuação (acertos, pontos fortes)
   - Lacunas e aspectos que impedem pontuação máxima
   - Sugestões específicas de melhoria

${criteriosEntrada.map(c => `
   • ${c.nome} (${c.nota.toFixed(1)}/${c.maximo.toFixed(1)} - peso ${(c.peso * 100).toFixed(0)}%):
     Justifique a nota atribuída, mencione acertos, lacunas, exemplos e relevância.`).join('')}`
    : `Avalie e atribua notas para os critérios padrão da banca ${banca}. Para cada critério, forneça:
   - Pontuação atribuída (justificada)
   - Elementos que justificam a pontuação (acertos, pontos fortes)
   - Lacunas e aspectos que impedem pontuação máxima
   - Sugestões específicas de melhoria`
}

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✏️ 3️⃣ EXEMPLOS DE CORREÇÕES E SUGESTÕES DE MELHORIA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Identifique e detalhe TODOS os erros encontrados:
   - Erros gramaticais (concordância, regência, pontuação, etc.)
   - Erros ortográficos
   - Problemas de coesão (uso inadequado de conectivos, repetições, etc.)
   - Problemas de coerência (contradições, falta de lógica, etc.)
   - Desvios da norma culta
   - Problemas de estruturação (parágrafos, desenvolvimento, conclusão)
   
   Para cada erro, forneça:
   - Trecho exato do texto
   - Tipo do erro
   - Explicação clara do problema
   - Sugestão de correção (reescreva o trecho corrigido)

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 4️⃣ TEXTO CORRIGIDO (OPCIONAL)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Apresente uma versão revisada do texto, mantendo o estilo original do candidato, 
   aplicando todas as correções sugeridas. Se o texto estiver muito bom, pode omitir esta seção.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 5️⃣ SÍNTESE FINAL (FEEDBACK PEDAGÓGICO)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Liste:
   - Pontos fortes do texto
   - Aspectos a desenvolver urgentemente
   - Sugestões personalizadas para a próxima redação
   - Foco nos critérios que mais impactam a nota na banca ${banca}

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🏛️ 6️⃣ ESTILO E VOCABULÁRIO ESPECÍFICOS DA BANCA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Adapte o tom e os comentários para refletir o perfil avaliativo real da ${banca}.

╔════════════════════════════════════════════════════════════════╗
║  REDAÇÃO A SER CORRIGIDA                                      ║
╚════════════════════════════════════════════════════════════════╝

${redacao}

╔════════════════════════════════════════════════════════════════╗
║  FORMATO DE SAÍDA                                               ║
╚════════════════════════════════════════════════════════════════╝

Retorne a resposta APENAS em formato JSON, seguindo rigorosamente o schema fornecido:

- "avaliacaoGeral": Síntese global (seção 1)
- "avaliacaoDetalhada": Array com análise de cada critério (seção 2), incluindo "peso" no objeto
- "errosDetalhados": Array com todos os erros identificados (seção 3)
- "textoCorrigido": Versão revisada (seção 4) - opcional
- "comentariosGerais": Comentários gerais consolidados
- "sinteseFinal": Feedback pedagógico final (seção 5)

IMPORTANTE: 
- Use a linguagem característica da banca ${banca}
- Seja detalhado, específico e pedagógico em todos os feedbacks
- JUSTIFIQUE as notas dadas, não as calcule
- Mantenha tom técnico de corretor oficial`;

    const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-pro', 
        contents: prompt, 
        config: { 
            responseMimeType: 'application/json', 
            responseSchema: correcaoSchema 
        } 
    });
    
    let jsonText = response.text.trim().replace(/^```json\n?|```$/g, '');
    const resultado = JSON.parse(jsonText) as any;
    
    // Garantir que os dados de entrada sejam preservados na resposta
    // Se a IA calculou a nota, usar o valor retornado; senão, usar o calculado
    const notaFinalRetornada = resultado.notaFinal ?? notaFinalCalculada;
    
    const correcaoCompleta: CorrecaoCompleta = {
        banca: banca,
        notaMaxima: notaMaxima,
        notaFinal: criteriosEntrada.length > 0 ? notaFinalCalculada : notaFinalRetornada,
        avaliacaoGeral: resultado.avaliacaoGeral || '',
        comentariosGerais: resultado.comentariosGerais || '',
        sinteseFinal: resultado.sinteseFinal || '',
        textoCorrigido: resultado.textoCorrigido || undefined,
        errosDetalhados: resultado.errosDetalhados || [],
        avaliacaoDetalhada: resultado.avaliacaoDetalhada?.map((item: any, index: number) => {
            // Se há critérios definidos pelo usuário, usar os valores definidos
            if (criteriosEntrada.length > 0 && criteriosEntrada[index]) {
                return {
                    criterio: item.criterio || criteriosEntrada[index].nome,
                    pontuacao: criteriosEntrada[index].nota,
                    maximo: criteriosEntrada[index].maximo,
                    peso: criteriosEntrada[index].peso,
                    feedback: item.feedback || ''
                };
            }
            // Se a IA calculou, usar os valores retornados
            return {
                criterio: item.criterio || '',
                pontuacao: item.pontuacao ?? 0,
                maximo: item.maximo ?? 0,
                peso: item.peso ?? 0,
                feedback: item.feedback || ''
            };
        }) || []
    };
    
    return correcaoCompleta;
};

export const extrairTextoDeImagem = async (base64Image: string, mimeType: string): Promise<string> => {
    if (!ai) {
        throw new Error('API Key do Gemini não configurada. Configure a variável GEMINI_API_KEY no arquivo .env');
    }
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
    if (!ai) {
        // Fallback: distribui igualmente entre as disciplinas
        const tempoPorDisciplina = Math.floor(tempoTotalMinutos / disciplinas.length);
        return disciplinas.map(d => ({ disciplina_id: d.id, tempo_previsto: tempoPorDisciplina * 60 }));
    }
    const prompt = `Crie uma sugestão de ciclo de estudos com ${tempoTotalMinutos} minutos totais para as matérias: ${disciplinas.map(d => `${d.nome} (dificuldade: ${d.dificuldade})`).join(', ')}. Retorne um array JSON com "disciplina_id" e "tempo_previsto" em minutos.`;
    const schema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { disciplina_id: { type: Type.STRING }, tempo_previsto: { type: Type.NUMBER } } } };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: schema } });
    let jsonText = response.text.trim().replace(/^```json\n?|```$/g, '');
    const sugestao = JSON.parse(jsonText) as {disciplina_id: string, tempo_previsto: number}[];
    return sugestao.map(s => ({ ...s, tempo_previsto: s.tempo_previsto * 60 }));
};

export const gerarMensagemMotivacionalIA = async (userName: string, tempoHojeMin: number, metaPercentual: number, streakDays: number, revisoesPendentes: number): Promise<string> => {
    if (!ai) {
        // Fallback: mensagem motivacional padrão
        return `Continue assim, ${userName}! Você está no caminho certo com ${tempoHojeMin} minutos de estudo hoje.`;
    }
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

// Planejamento e Trilha Semanal
export const saveTrilhaSemanal = async (studyPlanId: string, trilha: any) => {
    const { data, error } = await supabase
        .from('study_plans')
        .update({ trilha_semanal: trilha } as any)
        .eq('id', studyPlanId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getTrilhaSemanal = async (studyPlanId: string) => {
    const { data, error } = await supabase
        .from('study_plans')
        .select('trilha_semanal')
        .eq('id', studyPlanId)
        .single();
    if (error) throw error;
    return (data as any)?.trilha_semanal || null;
};

export const savePlanningConfig = async (studyPlanId: string, planningConfig: any) => {
    const { data, error } = await supabase
        .from('study_plans')
        .update({ planning_config: planningConfig } as any)
        .eq('id', studyPlanId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getPlanningConfig = async (studyPlanId: string) => {
    const { data, error } = await supabase
        .from('study_plans')
        .select('planning_config')
        .eq('id', studyPlanId)
        .single();
    if (error) throw error;
    return (data as any)?.planning_config || null;
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
// NOTA: O banco de dados usa camelCase para estas colunas (não snake_case)
const mapSimuladoToDb = (simuladoData: Partial<Simulation>) => {
    const { studyPlanId, ...rest } = simuladoData;
    // O banco usa camelCase: durationMinutes, isCebraspe
    // Não precisa mapear, apenas remover studyPlanId
    return rest;
};

const mapDbToSimulado = (dbData: any): Simulation => {
    // O banco retorna study_plan_id em snake_case, mas durationMinutes e isCebraspe em camelCase
    const { study_plan_id, ...rest } = dbData;
    return {
        ...rest,
        studyPlanId: study_plan_id,
    } as Simulation;
};

export const getSimulados = async (studyPlanId: string): Promise<Simulation[]> => {
    if (!studyPlanId) {
        console.warn("getSimulados: studyPlanId não fornecido, retornando array vazio");
        return [];
    }
    
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        console.warn("getSimulados: usuário não autenticado, retornando array vazio");
        return [];
    }
    
    try {
        const { data, error } = await supabase
            .from('simulados')
            .select('*')
            .eq('study_plan_id', studyPlanId);
        
        if (error) {
            // Se for erro 400, pode ser problema de permissões RLS - não lançar erro, apenas retornar vazio
            if (error.code === 'PGRST116' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
                console.warn("getSimulados: erro de permissão (RLS) ou tabela não encontrada, retornando array vazio", error.message);
                return [];
            }
            console.error("Erro ao buscar simulados:", error);
            throw error;
        }
        
        if (!data) {
            return [];
        }
        
        return (data as any[]).map(mapDbToSimulado);
    } catch (err: any) {
        // Se for erro 400 HTTP, tratar como problema de permissões
        if (err?.status === 400 || err?.code === 'PGRST116') {
            console.warn("getSimulados: erro 400 - problema de permissões ou schema, retornando array vazio");
            return [];
        }
        throw err;
    }
};

export const createSimulado = async (studyPlanId: string, simuladoData: Omit<Simulation, 'id' | 'studyPlanId'>): Promise<Simulation> => {
    const userId = await getUserId();
    const dbPayload = mapSimuladoToDb(simuladoData);
    dbPayload.study_plan_id = studyPlanId;
    dbPayload.user_id = userId;

    const { data, error } = await supabase.from('simulados').insert(dbPayload as any).select().single();
    
    if (error) {
        console.error('Erro ao criar simulado:', error);
        throw error;
    }
    
    if (!data) {
        throw new Error('Simulado criado, mas nenhum dado foi retornado');
    }
    
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