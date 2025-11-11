

import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, Friendship, FriendRequest, NivelDificuldade, NotasPesosEntrada } from '../types';
import { Simulation } from '../stores/useStudyStore';
import { subDays } from 'date-fns';

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
    if (!data.session?.user.id) throw new Error("Usuário não autenticado.");
    return data.session.user.id;
}

// --- Helper para garantir que o perfil existe ---
const ensureProfileExists = async (userId: string) => {
    // Verifica se o perfil existe
    const { data: profile, error: selectError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', userId)
        .single();

    // Se o perfil não existe (PGRST116 = no rows returned), cria ele
    if (selectError && selectError.code === 'PGRST116') {
        const { data: user, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('Erro ao obter dados do usuário:', userError);
            throw new Error('Erro ao obter dados do usuário autenticado. Tente fazer logout e login novamente.');
        }
        
        if (user?.user) {
            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    user_id: userId,
                    name: user.user.user_metadata?.name || user.user.email || 'Usuário',
                    email: user.user.email || '',
                    xp_total: 0,
                    current_streak_days: 0,
                    best_streak_days: 0,
                    has_seen_onboarding: false
                } as any);

            if (insertError) {
                console.error('Erro ao criar perfil:', insertError);
                
                // Mensagens de erro mais específicas
                if (insertError.code === '23505' || insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
                    // Perfil já existe (race condition), tudo bem - não precisa fazer nada
                    return;
                } else if (insertError.message?.includes('permission denied') || insertError.message?.includes('row-level security')) {
                    throw new Error('Erro ao criar perfil: permissão negada. Verifique as políticas RLS no banco de dados.');
                } else if (insertError.code === '23503') {
                    throw new Error('Erro ao criar perfil: referência inválida. Verifique se o usuário existe no sistema de autenticação.');
                }
                
                throw new Error(`Não foi possível criar o perfil do usuário: ${insertError.message || 'Erro desconhecido'}. Tente fazer logout e login novamente.`);
            }
        } else {
            throw new Error('Usuário não encontrado na autenticação. Tente fazer logout e login novamente.');
        }
    } else if (selectError && selectError.code !== 'PGRST116') {
        // Outro erro além de "não encontrado"
        console.error('Erro ao verificar perfil:', selectError);
        
        // Mensagens de erro mais específicas
        if (selectError.message?.includes('permission denied') || selectError.message?.includes('row-level security')) {
            throw new Error('Erro ao verificar perfil: permissão negada. Verifique as políticas RLS no banco de dados.');
        } else if (selectError.code === 'PGRST301' || selectError.message?.includes('JWT')) {
            throw new Error('Erro ao verificar perfil: sessão expirada. Tente fazer logout e login novamente.');
        }
        
        throw new Error(`Erro ao verificar perfil do usuário: ${selectError.message || selectError.code || 'Erro desconhecido'}`);
    }
}

// --- Helper para calcular nível ---

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


// --- AI SERVICES (Apenas funcionalidades de redação) ---

// Converte File para base64 (usado apenas para extração de texto de imagem na redação)
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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

    // Critérios específicos do Enem (5 competências)
    const criteriosEnem = [
        { nome: 'Competência 1: Domínio da modalidade escrita formal da Língua Portuguesa', maximo: 200, peso: 0.2 },
        { nome: 'Competência 2: Compreender a proposta de redação e aplicar conceitos', maximo: 200, peso: 0.2 },
        { nome: 'Competência 3: Selecionar, relacionar, organizar e interpretar informações', maximo: 200, peso: 0.2 },
        { nome: 'Competência 4: Demonstrar conhecimento dos mecanismos linguísticos para argumentação', maximo: 200, peso: 0.2 },
        { nome: 'Competência 5: Elaborar proposta de intervenção respeitando direitos humanos', maximo: 200, peso: 0.2 }
    ];

    // Normalizar CESPE para Cebraspe (mesma banca)
    const bancaNormalizada = (banca === 'CESPE' || banca === 'Cebraspe') ? 'Cebraspe' : banca;

    // Estilos de avaliação por banca
    const estiloBanca: Record<string, string> = {
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

    const estilo = estiloBanca[bancaNormalizada] || 'Siga os critérios padrão da banca, valorizando correção, coerência e adequação ao tema.';

    // Construir seção de critérios para o prompt
    const secoesCriterios = criteriosEntrada.length > 0
        ? criteriosEntrada.map(c => 
            `- ${c.nome}: Nota atribuída ${c.nota.toFixed(1)} / ${c.maximo.toFixed(1)} (peso: ${(c.peso * 100).toFixed(0)}%)`
        ).join('\n')
        : banca === 'Enem' || banca === 'ENEM'
            ? `A IA deve calcular as notas para as 5 COMPETÊNCIAS DO ENEM:
${criteriosEnem.map(c => `- ${c.nome}: Máximo ${c.maximo} pontos (peso ${(c.peso * 100).toFixed(0)}%)`).join('\n')}
Total: 1000 pontos (200 pontos por competência)`
            : `A IA deve calcular as notas para os critérios padrão da banca ${bancaNormalizada}.`;

    const prompt = `Você é um corretor especializado em redações de concursos públicos, com conhecimento profundo dos critérios de avaliação da banca "${bancaNormalizada}".

FUNÇÃO: ${criteriosEntrada.length > 0 
    ? 'Gerar uma correção textual completa com análise técnica e devolutiva pedagógica, INTERPRETANDO E EXPLICANDO as notas já atribuídas pelo avaliador. Você NÃO atribui notas, apenas explica e justifica as notas dadas.'
    : 'Gerar uma correção textual completa com análise técnica e devolutiva pedagógica, ATRIBUINDO NOTAS para cada critério baseado na avaliação do texto. Calcule a nota final somando as pontuações dos critérios.'
}

╔════════════════════════════════════════════════════════════════╗
║  DADOS DA AVALIAÇÃO (JÁ DEFINIDOS PELO AVALIADOR)            ║
╚════════════════════════════════════════════════════════════════╝

BANCA: ${bancaNormalizada}
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
   - Use termos e critérios característicos da banca ${bancaNormalizada}
   - Evite subjetividade excessiva; seja preciso e fundamentado

4. APRESENTE O PARECER FINAL EM 6 PARTES:

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 1️⃣ AVALIAÇÃO GERAL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Síntese global do desempenho, apontando se o texto cumpre o tema e o formato exigido pela banca ${bancaNormalizada}. 
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
    : banca === 'Enem' || banca === 'ENEM'
        ? `Avalie e atribua notas para as 5 COMPETÊNCIAS DO ENEM. Para cada competência, forneça:
   - Pontuação atribuída (0 a 200 pontos, justificada)
   - Elementos que justificam a pontuação (acertos, pontos fortes)
   - Lacunas e aspectos que impedem pontuação máxima
   - Sugestões específicas de melhoria

${criteriosEnem.map(c => `   • ${c.nome} (0-200 pontos, peso ${(c.peso * 100).toFixed(0)}%):`).join('\n')}`
        : `Avalie e atribua notas para os critérios padrão da banca ${bancaNormalizada}. Para cada critério, forneça:
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
   - Foco nos critérios que mais impactam a nota na banca ${bancaNormalizada}

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🏛️ 6️⃣ ESTILO E VOCABULÁRIO ESPECÍFICOS DA BANCA
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Adapte o tom e os comentários para refletir o perfil avaliativo real da ${bancaNormalizada}.

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
- Use a linguagem característica da banca ${bancaNormalizada}
- Seja detalhado, específico e pedagógico em todos os feedbacks
- JUSTIFIQUE as notas dadas, não as calcule
${(banca === 'Enem' || banca === 'ENEM') && criteriosEntrada.length === 0 ? `
- OBRIGATÓRIO: Retorne EXATAMENTE 5 competências do Enem na "avaliacaoDetalhada":
  1. Competência 1: Domínio da modalidade escrita formal da Língua Portuguesa (0-200)
  2. Competência 2: Compreender a proposta de redação e aplicar conceitos (0-200)
  3. Competência 3: Selecionar, relacionar, organizar e interpretar informações (0-200)
  4. Competência 4: Demonstrar conhecimento dos mecanismos linguísticos para argumentação (0-200)
  5. Competência 5: Elaborar proposta de intervenção respeitando direitos humanos (0-200)
- Cada competência deve ter máximo de 200 pontos e peso de 0.2 (20%)
- A nota final deve ser a soma das 5 competências (máximo 1000 pontos)` : ''}
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
        banca: bancaNormalizada,
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

export const gerarMensagemMotivacionalIA = async (
    nomeUsuario: string,
    tempoTotalHoje: number,
    metaPercentual: number,
    diasStreak: number,
    revisoesPendentes: number
): Promise<string> => {
    if (!ai || !apiKey) {
        // Se não houver API key, retornar mensagem padrão silenciosamente
        return "Continue estudando! Cada esforço te aproxima do seu objetivo.";
    }

    const prompt = `Você é um assistente motivacional especializado em ajudar estudantes de concursos públicos.

Gere uma mensagem motivacional personalizada e inspiradora para ${nomeUsuario} baseada nas seguintes informações:

- Tempo estudado hoje: ${tempoTotalHoje} minutos
- Progresso da meta diária: ${metaPercentual}%
- Sequência de dias estudando (streak): ${diasStreak} dias
- Revisões pendentes: ${revisoesPendentes}

INSTRUÇÕES:
1. Seja positivo, encorajador e autêntico
2. Reconheça o esforço e progresso do estudante
3. Adapte o tom baseado no progresso:
   - Se a meta está sendo atingida, celebre e incentive a continuar
   - Se está abaixo da meta, seja encorajador sem ser condescendente
   - Se o streak está alto, reconheça a consistência
4. Mencione brevemente as revisões pendentes se relevante
5. Mantenha a mensagem curta (máximo 2 frases)
6. Use linguagem natural e calorosa, como um mentor amigável
7. Não use emojis ou formatação especial

Retorne APENAS a mensagem motivacional, sem aspas ou formatação adicional.`;

    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt
        });
        return response.text.trim();
    } catch (error: any) {
        // Log apenas se não for erro de API key inválida (para não poluir o console)
        if (error?.error?.code !== 400 || !error?.error?.message?.includes('API key')) {
            console.error("Erro ao gerar mensagem motivacional:", error);
        }
        // Retornar mensagem padrão em caso de erro
        return "Continue estudando! Cada esforço te aproxima do seu objetivo.";
    }
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
    
    // Garante que o perfil existe antes de criar o study_plan
    // Isso evita erro 409 (foreign key constraint violation)
    await ensureProfileExists(userId);
    
    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('study_plans').insert({ ...studyPlanData, user_id: userId } as any).select().single();
    if (error) {
        console.error('Erro ao criar study_plan:', error);
        throw error;
    }
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

// Salvar trilhas por semana e estado de conclusão
export const saveTrilhasPorSemana = async (
    studyPlanId: string, 
    trilhasPorSemana: Record<string, any>, 
    trilhaConclusao: Record<string, boolean>
) => {
    try {
        const { data, error } = await supabase
            .from('study_plans')
            .update({ 
                trilhas_por_semana: trilhasPorSemana,
                trilha_conclusao: trilhaConclusao
            } as any)
            .eq('id', studyPlanId)
            .select()
            .single();
        
        if (error) {
            // Se for erro de coluna não encontrada, tentar usar trilha_semanal como fallback
            if (error.code === '42703' || error.message?.includes('column')) {
                console.warn("Colunas novas não existem, usando trilha_semanal como fallback");
                // Pegar a primeira trilha (semana atual) ou criar objeto com todas
                const weekKey = Object.keys(trilhasPorSemana)[0];
                const trilhaAtual = weekKey ? trilhasPorSemana[weekKey] : { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
                
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('study_plans')
                    .update({ trilha_semanal: trilhaAtual } as any)
                    .eq('id', studyPlanId)
                    .select()
                    .single();
                
                if (fallbackError) throw fallbackError;
                return fallbackData;
            }
            throw error;
        }
        return data;
    } catch (error: any) {
        console.error("Erro ao salvar trilhas:", error);
        throw error;
    }
};

export const getTrilhasPorSemana = async (studyPlanId: string) => {
    const { data, error } = await supabase
        .from('study_plans')
        .select('trilhas_por_semana, trilha_conclusao')
        .eq('id', studyPlanId)
        .single();
    
    // Se der erro de coluna não encontrada, retorna vazio (colunas podem não existir ainda)
    if (error) {
        if (error.code === '42703' || error.message?.includes('column')) {
            console.warn("Colunas trilhas_por_semana ou trilha_conclusao não existem no banco. Retornando valores vazios.");
            return {
                trilhasPorSemana: {},
                trilhaConclusao: {}
            };
        }
        throw error;
    }
    
    return {
        trilhasPorSemana: (data as any)?.trilhas_por_semana || {},
        trilhaConclusao: (data as any)?.trilha_conclusao || {}
    };
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
    if (!studyPlanId || studyPlanId.trim() === '') {
        throw new Error('studyPlanId é obrigatório para carregar as sessões de estudo.');
    }

    const userId = await getUserId();

    const { data, error } = await supabase
        .from('sessoes_estudo')
        .select('*')
        .eq('study_plan_id', studyPlanId)
        .eq('user_id', userId)
        .order('data_estudo', { ascending: false });
    if (error) throw error;
    return (data as any[]).map(mapDbToSessao);
};
export const createSessao = async (studyPlanId: string, itemData: Omit<SessaoEstudo, 'id' | 'studyPlanId'>): Promise<SessaoEstudo> => {
    const userId = await getUserId();
    
    // Garantir que o perfil existe antes de criar a sessão
    await ensureProfileExists(userId);
    
    // Validar campos obrigatórios
    if (!itemData.topico_id) {
        throw new Error('topico_id é obrigatório para criar uma sessão de estudo.');
    }
    
    if (!itemData.tempo_estudado || itemData.tempo_estudado < 1) {
        throw new Error('tempo_estudado deve ser maior que zero.');
    }
    
    if (!itemData.data_estudo) {
        throw new Error('data_estudo é obrigatória.');
    }
    
    // Validar se o tópico existe
    const { data: topicoData, error: topicoError } = await supabase
        .from('topicos')
        .select('id')
        .eq('id', itemData.topico_id)
        .single();
    
    if (topicoError || !topicoData) {
        console.error("Tópico não encontrado:", topicoError);
        throw new Error('Tópico não encontrado. Verifique se o tópico existe no banco de dados.');
    }
    
    // Garantir que data_estudo está no formato correto (YYYY-MM-DD)
    let dataEstudo = itemData.data_estudo;
    if (dataEstudo.includes('T')) {
        dataEstudo = dataEstudo.split('T')[0];
    }
    // Garantir que é apenas a data, sem hora
    if (dataEstudo.length > 10) {
        dataEstudo = dataEstudo.substring(0, 10);
    }
    
    // Criar payload apenas com os campos necessários e no formato correto
    const payload: {
        user_id: string;
        study_plan_id: string;
        topico_id: string;
        tempo_estudado: number;
        data_estudo: string;
        comentarios?: string | null;
    } = {
        user_id: userId,
        study_plan_id: studyPlanId,
        topico_id: itemData.topico_id,
        tempo_estudado: Math.round(itemData.tempo_estudado), // Garantir que é inteiro
        data_estudo: dataEstudo,
    };
    
    // Adicionar comentários apenas se existirem
    if (itemData.comentarios !== undefined && itemData.comentarios !== null) {
        payload.comentarios = itemData.comentarios;
    }
    
    const { data, error } = await supabase.from('sessoes_estudo').insert(payload as any).select('*').single();
    if (error) {
        console.error("Failed to create session:", error);
        console.error("Payload enviado:", payload);
        // Melhorar mensagem de erro para o usuário
        if (error.code === '23503') {
            throw new Error('Erro ao criar sessão: referência inválida. Verifique se o tópico e o plano de estudo existem.');
        } else if (error.code === '23505') {
            throw new Error('Erro ao criar sessão: sessão duplicada.');
        } else if (error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
            throw new Error('Erro ao criar sessão: permissão negada. Verifique suas permissões no banco de dados.');
        } else if (error.code === 'PGRST116') {
            throw new Error('Erro ao criar sessão: nenhum dado retornado após inserção.');
        } else if (error.message?.includes('invalid input value for enum xp_log_event')) {
            throw new Error('Erro ao criar sessão: o enum xp_log_event no banco de dados não contém o valor necessário. Execute o script fix_xp_log_enum.sql no Supabase para corrigir.');
        }
        throw new Error(`Erro ao criar sessão: ${error.message || 'Erro desconhecido'}`);
    }
    
    if (!data) {
        throw new Error('Erro ao criar sessão: nenhum dado retornado após inserção.');
    }
    
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
        .select('user_id, name')
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
        };
    });
};

export const searchUsers = async (query: string, currentUserId: string): Promise<User[]> => {
    // Sanitizar e validar a query para evitar problemas com caracteres especiais
    const sanitizedQuery = query
        .trim()
        .slice(0, 100) // Limitar tamanho máximo para prevenir DoS
        .replace(/[%_\\]/g, '') // Remover caracteres especiais do SQL LIKE
        .replace(/[<>]/g, '') // Remover caracteres que podem causar problemas
        .trim();
    
    // Validação rigorosa
    if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return [];
    }
    
    // Validar que não é apenas espaços ou caracteres especiais
    // Permitir letras, números, espaços, @, ponto e hífen (para emails e nomes)
    if (!/^[\w\s@.-]+$/.test(sanitizedQuery)) {
        console.warn('Query de busca contém caracteres inválidos, ignorando');
        return [];
    }

    try {
        const { data: relData, error: relError } = await supabase
            .from('friendships')
            .select('user_id_1, user_id_2')
            .or(`user_id_1.eq.${currentUserId},user_id_2.eq.${currentUserId}`);

        if (relError) {
            console.error('Error fetching friendships:', relError);
            throw relError;
        }
        
        const relationships = (relData || []) as any[];

        const existingRelationshipIds = new Set(
            relationships.flatMap(r => [r.user_id_1, r.user_id_2])
        );
        existingRelationshipIds.add(currentUserId);

        // Buscar usuários que correspondem à query
        // O Supabase trata automaticamente caracteres especiais na query
        const { data: usersData, error: usersError } = await supabase
            .from('profiles')
            .select('user_id, name, email')
            .or(`name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%`)
            .limit(50); // Buscar mais para depois filtrar
            
        if (usersError) {
            console.error('Error searching users:', usersError);
            throw usersError;
        }
        
        const users = (usersData || []) as any[];

        // Filtrar usuários que já são amigos ou o próprio usuário
        const filteredUsers = users
            .filter(p => !existingRelationshipIds.has(p.user_id))
            .slice(0, 10); // Limitar a 10 resultados

        return filteredUsers.map(p => ({
            id: p.user_id,
            name: p.name,
            email: p.email,
        }));
    } catch (error) {
        console.error('Failed to search users:', error);
        throw error;
    }
};

export const sendFriendRequest = async (requesterId: string, receiverId: string) => {
    // Verificar se já existe uma relação entre os dois usuários
    // Precisamos verificar ambas as direções: (A->B) e (B->A)
    // E também verificar todos os status (pending, accepted, declined, blocked)
    const { data: existingData1, error: checkError1 } = await supabase
        .from('friendships')
        .select('id, status')
        .eq('user_id_1', requesterId)
        .eq('user_id_2', receiverId)
        .limit(1);

    if (checkError1) {
        console.error('Error checking friendship (direction 1):', checkError1);
        throw checkError1;
    }

    const { data: existingData2, error: checkError2 } = await supabase
        .from('friendships')
        .select('id, status')
        .eq('user_id_1', receiverId)
        .eq('user_id_2', requesterId)
        .limit(1);

    if (checkError2) {
        console.error('Error checking friendship (direction 2):', checkError2);
        throw checkError2;
    }

    const existing = [...(existingData1 || []), ...(existingData2 || [])] as any[];

    if (existing && existing.length > 0) {
        const existingStatus = existing[0].status;
        if (existingStatus === 'accepted') {
            throw new Error("Vocês já são amigos.");
        } else if (existingStatus === 'pending') {
            throw new Error("Já existe um pedido de amizade pendente.");
        } else if (existingStatus === 'declined') {
            // Se foi recusado anteriormente, podemos permitir criar um novo pedido
            // Mas primeiro vamos deletar o registro antigo
            try {
                await supabase
                    .from('friendships')
                    .delete()
                    .eq('id', existing[0].id);
            } catch (deleteError) {
                console.error('Error deleting declined friendship:', deleteError);
                // Continua mesmo se não conseguir deletar
            }
        } else {
            throw new Error("Já existe uma relação entre vocês.");
        }
    }

    // Inserir novo pedido de amizade
    const { error: insertError } = await supabase
        .from('friendships')
        .insert({
            user_id_1: requesterId,
            user_id_2: receiverId,
            status: 'pending',
        } as any);
    
    if (insertError) {
        // Se o erro for 409 (Conflict), provavelmente houve uma race condition
        // ou existe uma constraint unique que não foi capturada na verificação
        if (insertError.code === '23505' || insertError.message?.includes('409') || insertError.message?.includes('duplicate')) {
            console.warn('Friendship already exists (race condition):', insertError);
            throw new Error("Já existe uma amizade ou um pedido pendente. Por favor, recarregue a página.");
        }
        console.error('Error inserting friendship:', insertError);
        throw insertError;
    }
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

