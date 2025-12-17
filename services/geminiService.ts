

import { GoogleGenAI, Type } from '@google/genai';
import { supabase } from './supabaseClient';
import { Flashcard, CorrecaoCompleta, RedacaoCorrigida, User, StudyPlan, Disciplina, Topico, SessaoEstudo, Ciclo, SessaoCiclo, Revisao, CadernoErro, Friendship, FriendRequest, NivelDificuldade, NotasPesosEntrada, Simulation } from '../types';
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
    console.log('🔑 Status da API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configurada (Vite)' : (process.env?.GEMINI_API_KEY ? 'Configurada (Process)' : 'Ausente'));
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
        throw new Error('API Key do Gemini não configurada. Configure a variável VITE_GEMINI_API_KEY no arquivo .env');
    }

    console.log('📝 Iniciando correção de redação...', {
        banca,
        notaMaxima,
        tamanhoTexto: redacao.length,
        temTema: !!tema,
        temNotasManuais: !!notasPesos
    });

    // Validar tamanho do texto
    if (redacao.length > 10000) {
        console.warn('⚠️ Texto muito longo, pode causar lentidão');
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
        // Calcular nota final como soma direta das notas informadas
        // Os pesos são calculados automaticamente e usados apenas para contexto da IA
        notaFinalCalculada = criteriosEntrada.reduce((sum, c) => sum + c.nota, 0);
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
        'FGV': 'Estilo técnico e rigoroso para questões discursivas. Valorize objetividade, precisão conceitual, clareza e rigor terminológico. Penalize superficialidade, divagações, repetições desnecessárias e falta de tecnicidade. Exija texto corrido (não aceite listas ou tópicos soltos). Tom analítico e avaliativo, focado em domínio técnico e correção linguística.',
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
        : (bancaNormalizada === 'Cebraspe' || banca === 'CESPE')
            ? `A IA deve calcular as notas seguindo EXATAMENTE os critérios oficiais da CEBRASPE para QUESTÃO DISCURSIVA:
NOTA MÁXIMA DEFINIDA: ${notaMaxima} pontos

Os critérios devem ser calculados proporcionalmente:
- Conteúdo / Domínio Técnico: Máximo ${(notaMaxima * 0.70).toFixed(2)} pontos (70% da nota máxima - avalia atendimento ao tema, profundidade técnica, exatidão conceitual, argumentação, precisão terminológica)
- Estrutura Textual: Máximo ${(notaMaxima * 0.10).toFixed(2)} pontos (10% da nota máxima - avalia introdução/desenvolvimento/conclusão, organização lógica, conectores, paragrafação)
- Expressão Escrita / Gramática: Máximo ${(notaMaxima * 0.20).toFixed(2)} pontos (20% da nota máxima - avalia norma culta, ortografia, regência, concordância, pontuação, coesão, precisão vocabular)

Nota Final: Soma das três notas (máximo ${notaMaxima} pontos). 
IMPORTANTE: Calcule as notas proporcionalmente à nota máxima definida (${notaMaxima} pontos), não use valores fixos de 70/10/20.`
            : bancaNormalizada === 'FGV'
                ? `A IA deve calcular as notas seguindo EXATAMENTE os critérios oficiais da FGV para QUESTÃO DISCURSIVA TÉCNICA:
- Domínio dos Conhecimentos Específicos: Máximo 50 pontos (peso 50%)
  * Atendimento completo ao tema e subtópicos
  * Exatidão técnica e rigor conceitual
  * Capacidade de explicar, relacionar e aplicar conceitos
  * Profundidade analítica
  * Coerência argumentativa
  * Precisão terminológica
- Uso da Língua Portuguesa: Máximo 50 pontos (peso 50%)
  * Coesão e coerência textual
  * Clareza e objetividade
  * Estrutura lógica (introdução → desenvolvimento → conclusão)
  * Correção gramatical, ortografia, morfossintaxe, pontuação
  * Adequação à norma culta e precisão vocabular
Nota Final: Soma das duas notas (máximo 100 pontos)`
                : banca === 'Enem' || banca === 'ENEM'
                    ? `A IA deve calcular as notas para as 5 COMPETÊNCIAS DO ENEM:
${criteriosEnem.map(c => `- ${c.nome}: Máximo ${c.maximo} pontos (peso ${(c.peso * 100).toFixed(0)}%)`).join('\n')}
Total: 1000 pontos (200 pontos por competência)`
                    : `A IA deve calcular as notas para os critérios padrão da banca ${bancaNormalizada}.`;

    const prompt = `Você é um corretor especializado em redações de concursos públicos, com conhecimento profundo dos critérios de avaliação da banca "${bancaNormalizada}". Você possui anos de experiência corrigindo redações e conhece os padrões específicos de cada banca examinadora.

FUNÇÃO: ${criteriosEntrada.length > 0
            ? 'Gerar uma correção textual completa com análise técnica e devolutiva pedagógica, INTERPRETANDO E EXPLICANDO as notas já atribuídas pelo avaliador. Você NÃO atribui notas, apenas explica e justifica as notas dadas de forma detalhada e fundamentada.'
            : 'Gerar uma correção textual completa com análise técnica e devolutiva pedagógica, ATRIBUINDO NOTAS para cada critério baseado na avaliação rigorosa do texto. Calcule a nota final somando as pontuações dos critérios, sendo criterioso e justo.'
        }

╔════════════════════════════════════════════════════════════════╗
║  DADOS DA AVALIAÇÃO (JÁ DEFINIDOS PELO AVALIADOR)            ║
╚════════════════════════════════════════════════════════════════╝

BANCA: ${bancaNormalizada}
TEMA: ${tema || 'Não especificado'}
NOTA MÁXIMA: ${notaMaxima} pontos

CRITÉRIOS E NOTAS ATRIBUÍDAS:
${secoesCriterios}

${criteriosEntrada.length > 0 ? `NOTA FINAL CALCULADA: ${notaFinalCalculada.toFixed(1)} / ${notaMaxima}` : 'A IA deve calcular a nota final baseada na avaliação rigorosa dos critérios.'}

${notasPesos?.observacaoAvaliador ? `OBSERVAÇÃO DO AVALIADOR: ${notasPesos.observacaoAvaliador}\n` : ''}

╔════════════════════════════════════════════════════════════════╗
║  INSTRUÇÕES DETALHADAS PARA A CORREÇÃO                         ║
╚════════════════════════════════════════════════════════════════╝

1. USE O ESTILO DE CORREÇÃO DA BANCA INDICADA:
   ${estilo}
   
   IMPORTANTE: Adapte seu vocabulário e critérios de avaliação para refletir exatamente como a banca ${bancaNormalizada} corrige redações. Use exemplos concretos do texto para fundamentar suas observações.

2. INTERPRETE E EXPLIQUE AS NOTAS DADAS (quando aplicável):
   - Justifique por que o texto MERECE a nota informada em cada critério com exemplos específicos
   - Identifique os elementos que justificam essa pontuação (ou poderiam elevá-la)
   - Explique o que precisa ser melhorado em cada eixo para atingir pontuação máxima
   - Seja técnico e objetivo, usando linguagem de avaliador oficial
   - Cite trechos específicos do texto para fundamentar cada observação

3. MANTENHA TOM TÉCNICO DE CORRETOR:
   - Linguagem formal e objetiva, mas pedagógica e construtiva
   - Use termos e critérios característicos da banca ${bancaNormalizada}
   - Evite subjetividade excessiva; seja preciso e fundamentado
   - Sempre relacione suas observações a trechos específicos do texto

4. SEJA METICULOSO NA IDENTIFICAÇÃO DE ERROS:
   - Analise palavra por palavra, frase por frase
   - Identifique TODOS os erros, mesmo os menores
   - Categorize os erros de forma clara (gramatical, ortográfico, coesão, coerência, estrutura)
   - Para cada erro, forneça contexto suficiente para o candidato entender o problema

5. APRESENTE O PARECER FINAL EM 6 PARTES DETALHADAS:

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
            : (bancaNormalizada === 'Cebraspe' || banca === 'CESPE')
                ? `Avalie seguindo EXATAMENTE os critérios oficiais da CEBRASPE para QUESTÃO DISCURSIVA:
   
   Para a redação, forneça 5 entregas obrigatórias:
   
   (1) CORREÇÃO TÉCNICA DETALHADA (0–70 pontos):
   - Avalie "Conteúdo / Domínio Técnico"
   - Explique tópico por tópico: o que foi atendido, o que faltou, erros conceituais, profundidade, precisão técnica
   - Avalie: atendimento integral ao tema, profundidade técnica, exatidão conceitual, argumentação objetiva, precisão terminológica
   - Cite trechos específicos do texto
   - Justifique a nota atribuída (0 a 70 pontos)
   - ATENÇÃO: Fuga total ao tema = 0 pontos. Cópia do enunciado não pontua.
   
   (2) CORREÇÃO DA ESTRUTURA TEXTUAL (0–10 pontos):
   - Avalie: paragrafação, lógica, conectores, fluxo
   - Verifique existência de introdução, desenvolvimento e conclusão
   - Avalie organização lógica e encadeamento
   - Justifique a nota atribuída (0 a 10 pontos)
   
   (3) CORREÇÃO LINGUÍSTICA (0–20 pontos):
   - Liste TODOS os erros, explique por quê, indique correções e elogie acertos
   - Avalie: norma culta, ortografia, acentuação, regência, concordância, pontuação, coesão, precisão vocabular
   - Justifique a nota atribuída (0 a 20 pontos)
   
   (4) NOTA FINAL (0 a 100 pontos):
   - Soma: Conteúdo (até 70) + Estrutura (até 10) + Linguagem (até 20) = Nota Final
   - OU aplique fórmula alternativa quando aplicável: NPD = NC − (NE / TL)
   - Se resultado for negativo, atribua zero
   
   (5) VERSÃO REESCRITA NOTA 100:
   - Reescreva o texto impecável, objetivo, técnico, em norma culta, com coesão forte, todos os tópicos atendidos
   
   Estrutura da "avaliacaoDetalhada":
   • Conteúdo / Domínio Técnico (0-70 pontos): [avaliar e justificar nota tópico por tópico]
   • Estrutura Textual (0-10 pontos): [avaliar paragrafação, lógica, conectores, fluxo]
   • Expressão Escrita / Gramática (0-20 pontos): [listar todos os erros e acertos, justificar nota]
   
   IMPORTANTE: 
   - A "avaliacaoGeral" deve conter a correção técnica detalhada tópico por tópico
   - A "notaFinal" deve ser a soma das três notas (máximo 100 pontos)
   - O "textoCorrigido" deve conter a versão reescrita nota 100
   - Seja rigoroso: penalize tópicos/listas soltas, divagações, erros conceituais
   - Zeramento total se houver fuga ao tema, ilegitibilidade ou desrespeito ao comando`
                : bancaNormalizada === 'FGV'
                    ? `Avalie seguindo EXATAMENTE os critérios oficiais da FGV para QUESTÃO DISCURSIVA TÉCNICA:
   
   Para a redação, forneça 4 entregas obrigatórias:
   
   (1) CORREÇÃO TÉCNICA – Nota (0 a 50 pontos):
   - Avalie "Domínio dos Conhecimentos Específicos"
   - Explique ponto a ponto onde o candidato acertou e errou
   - Avalie: atendimento ao tema, exatidão técnica, rigor conceitual, profundidade analítica, coerência argumentativa, precisão terminológica
   - Cite trechos específicos do texto
   - Justifique a nota atribuída (0 a 50 pontos)
   
   (2) CORREÇÃO LINGUÍSTICA – Nota (0 a 50 pontos):
   - Avalie "Uso da Língua Portuguesa"
   - Corrija tudo: gramática, coesão, coerência, estrutura, clareza, adequação à norma culta
   - Identifique todos os erros: ortografia, morfossintaxe, pontuação
   - Avalie estrutura lógica (introdução → desenvolvimento → conclusão)
   - Justifique a nota atribuída (0 a 50 pontos)
   
   (3) NOTA FINAL (0 a 100 pontos):
   - Soma das notas: Nota Final = Domínio dos Conhecimentos Específicos + Uso da Língua Portuguesa
   - Mostre o cálculo completo
   
   (4) VERSÃO REESCRITA NOTA 100:
   - Reescreva o texto atingindo nota máxima
   - Mantenha o tema original
   - Use linguagem técnica adequada, objetividade, argumentação madura e rigor conceitual
   - Garanta estrutura lógica completa
   
   Estrutura da "avaliacaoDetalhada":
   • Domínio dos Conhecimentos Específicos (0-50 pontos, peso 50%): [avaliar e justificar nota]
   • Uso da Língua Portuguesa (0-50 pontos, peso 50%): [avaliar e justificar nota]
   
   IMPORTANTE: 
   - A "avaliacaoGeral" deve conter a correção técnica detalhada
   - A "notaFinal" deve ser a soma das duas notas (máximo 100 pontos)
   - O "textoCorrigido" deve conter a versão reescrita nota 100
   - Seja rigoroso: penalize listas/tópicos soltos, divagações, falta de tecnicidade
   - Zeramento total se houver fuga ao tema, ilegitibilidade ou ausência de resposta`
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
   Identifique e detalhe TODOS os erros encontrados de forma sistemática:
   
   CATEGORIAS DE ERROS A IDENTIFICAR:
   - Erros gramaticais (concordância verbal/nominal, regência, pontuação inadequada, crase, etc.)
   - Erros ortográficos (grafia incorreta, acentuação, hífen)
   - Problemas de coesão (uso inadequado de conectivos, repetições excessivas, falta de conectivos, etc.)
   - Problemas de coerência (contradições lógicas, falta de lógica argumentativa, ideias desconexas)
   - Desvios da norma culta (coloquialismos, gírias, informalidades)
   - Problemas de estruturação (parágrafos mal organizados, desenvolvimento insuficiente, conclusão fraca)
   - Problemas de vocabulário (repetição excessiva, palavras inadequadas ao contexto, pobreza lexical)
   - Problemas de argumentação (falta de exemplos, argumentos fracos, ausência de dados/estatísticas)
   
   PARA CADA ERRO IDENTIFICADO, forneça OBRIGATORIAMENTE:
   - Trecho exato do texto (copie literalmente, com pelo menos 10 palavras de contexto antes e depois)
   - Tipo do erro (seja específico: "Erro de concordância verbal", "Uso inadequado de conectivo", etc.)
   - Explicação clara e didática do problema (explique POR QUE está errado)
   - Sugestão de correção (reescreva o trecho corrigido, mantendo o sentido original quando possível)
   - Nível de gravidade (leve, moderado, grave) - isso ajuda o candidato a priorizar correções
   
   IMPORTANTE: Seja generoso na identificação de erros. É melhor identificar muitos erros pequenos do que deixar passar problemas que podem ser corrigidos.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 4️⃣ TEXTO CORRIGIDO (OPCIONAL)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Apresente uma versão revisada do texto, mantendo o estilo original do candidato, 
   aplicando todas as correções sugeridas. Se o texto estiver muito bom, pode omitir esta seção.

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💡 5️⃣ SÍNTESE FINAL (FEEDBACK PEDAGÓGICO)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Forneça um feedback pedagógico completo e acionável:
   
   PONTOS FORTES DO TEXTO:
   - Liste 3-5 aspectos positivos com exemplos específicos do texto
   - Reconheça o que o candidato já domina bem
   
   ASPECTOS A DESENVOLVER URGENTEMENTE:
   - Identifique 3-5 problemas mais críticos que impactam a nota
   - Priorize os que têm maior peso na avaliação da banca ${bancaNormalizada}
   - Explique o impacto de cada problema na nota final
   
   SUGESTÕES PERSONALIZADAS PARA A PRÓXIMA REDAÇÃO:
   - Dê orientações práticas e específicas baseadas nos erros encontrados
   - Sugira técnicas de estudo ou prática para melhorar os pontos fracos
   - Indique recursos ou materiais que podem ajudar (quando relevante)
   
   FOCO NOS CRITÉRIOS QUE MAIS IMPACTAM A NOTA:
   - Explique quais critérios têm maior peso na banca ${bancaNormalizada}
   - Indique qual critério, se melhorado, teria maior impacto na nota final
   - Dê dicas específicas sobre como melhorar nesses critérios
   
   PLANO DE AÇÃO:
   - Forneça 3-5 ações concretas que o candidato pode tomar imediatamente
   - Seja específico e prático (ex: "Pratique o uso de conectivos de causa e consequência")

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
- "notaFinal": OBRIGATÓRIO - A nota final calculada (soma de todas as pontuações dos critérios em "avaliacaoDetalhada")

╔════════════════════════════════════════════════════════════════╗
║  REGRAS CRÍTICAS PARA A CORREÇÃO                              ║
╚════════════════════════════════════════════════════════════════╝

IMPORTANTE: 
- Use a linguagem característica da banca ${bancaNormalizada}
- Seja EXTREMAMENTE detalhado, específico e pedagógico em todos os feedbacks
- JUSTIFIQUE as notas dadas com exemplos concretos do texto, não apenas calcule
- Cite trechos específicos do texto em todas as suas observações
- Seja construtivo: além de apontar erros, explique como melhorar
- Priorize a clareza: use linguagem técnica mas acessível
- Seja rigoroso mas justo: não seja excessivamente crítico nem complacente
- Identifique padrões de erro: se o candidato repete o mesmo tipo de erro, destaque isso

QUALIDADE DO FEEDBACK:
- Cada feedback deve ter pelo menos 2-3 frases explicativas
- Use exemplos concretos do texto sempre que possível
- Relacione os erros aos critérios de avaliação da banca
- Forneça contexto: explique não apenas o que está errado, mas por que está errado

${(bancaNormalizada === 'Cebraspe' || banca === 'CESPE') && criteriosEntrada.length === 0 ? `
╔════════════════════════════════════════════════════════════════╗
║  CRITÉRIOS OFICIAIS CEBRASPE (MODELO OFICIAL)                 ║
╚════════════════════════════════════════════════════════════════╝

OBRIGATÓRIO PARA CEBRASPE: Aplique rigorosamente as normas e métodos reais da banca para correção de questões discursivas (até 30 linhas).

🔷 1) INTERPRETAÇÃO DO ENUNCIADO:

Antes de tudo:
- Leia o texto do candidato e identifique os comandos da questão
- Liste cada tópico obrigatório
- Avalie se a redação responde integralmente, parcialmente ou não responde a cada comando

🔷 2) CRITÉRIOS OFICIAIS DO CEBRASPE:

A) CONTEÚDO / DOMÍNIO TÉCNICO (0 a 70 pontos):
   Avalie com base em:
   - Atendimento integral ao tema e aos subtópicos
   - Profundidade e rigor técnico
   - Exatidão conceitual
   - Argumentação objetiva e lógica
   - Precisão terminológica
   - Visão analítica e crítica própria da área
   - Coerência entre os parágrafos
   - Ausência de erros teóricos
   - Ausência de divagação ou "encheção de linguiça"
   
   ATENÇÃO:
   - Fuga total ao tema = nota ZERO
   - Parte do texto que copia o enunciado não pontua
   - Informação tecnicamente falsa deve ser penalizada

B) ESTRUTURA TEXTUAL (0 a 10 pontos):
   Avalie:
   - Existência de introdução, desenvolvimento e conclusão
   - Organização lógica do texto
   - Conectores e encadeamento
   - Paragrafação correta
   - Fluidez

C) EXPRESSÃO ESCRITA / GRAMÁTICA (0 a 20 pontos):
   Avalie:
   - Adequação à norma culta
   - Ortografia e acentuação
   - Regência e concordância
   - Pontuação
   - Coesão sequencial
   - Precisão vocabular
   - Clareza e objetividade

🔷 3) PENALIDADES OFICIAIS (APLIQUE O QUE SE ENQUADRAR):

- Fuga total ao tema → 0 na redação inteira
- Texto ilegível → 0
- Desrespeito ao comando → redução proporcional
- Uso de tópicos, esquemas, listas ou enumerações → penalização (Cebraspe exige texto corrido)
- Falta de paragrafação → redução
- Trechos decorativos ou irrelevantes → reduzir conteúdo
- Repetição proposital para preencher linhas → penalizar
- Erro conceitual relevante → penalizar fortemente
- Cópia de trechos do enunciado → não contar na nota de conteúdo
- Extrapolação do limite de linhas → desconsiderar excedente e penalizar se prejudicar conteúdo

🔷 4) FÓRMULA OFICIAL (QUANDO APLICÁVEL):

Use, quando cabível:
NPD = NC − (NE / TL)

onde:
- NC = nota de conteúdo (70) + estrutura (10) = máximo 80 pontos
- NE = número de erros linguísticos
- TL = total de linhas escritas

Se resultar negativo → atribua zero.

🔷 5) SUA RESPOSTA DEVE ENTREGAR O SEGUINTE (5 ENTREGAS OBRIGATÓRIAS):

(1) CORREÇÃO TÉCNICA DETALHADA (0–${(notaMaxima * 0.70).toFixed(2)} pontos):
   Explique tópico por tópico:
   - O que foi atendido
   - O que faltou
   - Erros conceituais
   - Profundidade
   - Precisão técnica
   - Cite trechos específicos do texto

(2) CORREÇÃO DA ESTRUTURA TEXTUAL (0–${(notaMaxima * 0.10).toFixed(2)} pontos):
   Avalie: paragrafação, lógica, conectores, fluxo
   - Identifique se há introdução, desenvolvimento e conclusão
   - Avalie organização lógica e encadeamento
   - Justifique a nota atribuída

(3) CORREÇÃO LINGUÍSTICA (0–${(notaMaxima * 0.20).toFixed(2)} pontos):
   Liste os erros, explique por quê, indique correções e elogie acertos
   - Identifique TODOS os erros: ortografia, acentuação, regência, concordância, pontuação
   - Explique cada erro de forma didática
   - Sugira correções
   - Destaque acertos quando houver

(4) NOTA FINAL (0 a ${notaMaxima} pontos):
   Soma de:
   - Conteúdo (até ${(notaMaxima * 0.70).toFixed(2)})
   - Estrutura (até ${(notaMaxima * 0.10).toFixed(2)})
   - Linguagem (até ${(notaMaxima * 0.20).toFixed(2)})
   Total máximo: ${notaMaxima} pontos
   
   OU aplique a fórmula NC − (NE/TL) caso seja solicitada no edital específico.
   Se a fórmula resultar em valor negativo, atribua zero.

(5) VERSÃO REESCRITA NOTA MÁXIMA (${notaMaxima} pontos):
   Reescreva o texto:
   - Impecável
   - Objetivo
   - Técnico
   - Em norma culta
   - Com coesão forte
   - Com todos os tópicos atendidos
   - No padrão Cebraspe de excelência

INSTRUÇÕES PARA A CORREÇÃO:
- Na "avaliacaoDetalhada", retorne EXATAMENTE 3 critérios:
  * Critério 1: "Conteúdo / Domínio Técnico" (0-${(notaMaxima * 0.70).toFixed(2)} pontos, 70% da nota máxima) - com feedback detalhado tópico por tópico
  * Critério 2: "Estrutura Textual" (0-${(notaMaxima * 0.10).toFixed(2)} pontos, 10% da nota máxima) - avaliando paragrafação, lógica, conectores
  * Critério 3: "Expressão Escrita / Gramática" (0-${(notaMaxima * 0.20).toFixed(2)} pontos, 20% da nota máxima) - listando todos os erros e acertos
- A "notaFinal" deve ser a SOMA das três notas (máximo ${notaMaxima} pontos): Conteúdo + Estrutura + Linguagem
- IMPORTANTE: Calcule as notas proporcionalmente. Se a nota máxima for ${notaMaxima}, os máximos são ${(notaMaxima * 0.70).toFixed(2)}, ${(notaMaxima * 0.10).toFixed(2)} e ${(notaMaxima * 0.20).toFixed(2)} respectivamente.
- Na "avaliacaoGeral", inclua a correção técnica detalhada tópico por tópico
- Na seção de erros, liste todos os erros linguísticos encontrados com explicações
- No "textoCorrigido", forneça a versão reescrita com nota máxima (${notaMaxima} pontos)
- IMPORTANTE: Seja rigoroso e técnico, seguindo exatamente os padrões oficiais do Cebraspe
- Conte o número total de linhas efetivamente escritas (TL)
- Identifique TODOS os erros gramaticais (NE) e liste-os detalhadamente` : bancaNormalizada === 'FGV' && criteriosEntrada.length === 0 ? `
╔════════════════════════════════════════════════════════════════╗
║  CRITÉRIOS ESPECÍFICOS DA FGV (QUESTÃO DISCURSIVA TÉCNICA)    ║
╚════════════════════════════════════════════════════════════════╝

OBRIGATÓRIO PARA FGV: A avaliação deve seguir EXATAMENTE os critérios oficiais da FGV:

1. FORMATO DA QUESTÃO:
   - O candidato deve responder diretamente ao comando da questão
   - Deve apresentar introdução, desenvolvimento e conclusão
   - Deve manter objetividade, precisão conceitual e clareza
   - Deve mobilizar corretamente conceitos técnicos da área solicitada
   - Questão discursiva técnica de até 30 linhas

2. CRITÉRIOS OFICIAIS FGV (PESO 50/50):

   A) DOMÍNIO DOS CONHECIMENTOS ESPECÍFICOS – 50% (0 a 50 pontos):
      Avalie minuciosamente:
      - Atendimento completo ao tema e aos subtópicos pedidos
      - Exatidão técnica e rigor conceitual
      - Capacidade de explicar, relacionar e aplicar conceitos
      - Profundidade analítica
      - Coerência argumentativa
      - Precisão terminológica (uso correto da linguagem técnica da área)
      
      IMPORTANTE: Se houver fuga total ao tema, atribua 0 pontos.

   B) USO DA LÍNGUA PORTUGUESA – 50% (0 a 50 pontos):
      Avalie criteriosamente:
      - Coesão e coerência textual
      - Clareza e objetividade
      - Estrutura lógica (introdução → desenvolvimento → conclusão)
      - Correção gramatical
      - Ortografia e acentuação
      - Morfossintaxe
      - Pontuação
      - Adequação à norma culta
      - Precisão vocabular

3. REGRAS ESPECIAIS FGV:
   - Responda somente o que está dentro do espaço destinado (desconsidere excesso de linhas)
   - Penalize contradições, repetições desnecessárias e divagações
   - Remova pontos se houver frases vagas, opinião pessoal ou falta de tecnicidade
   - NÃO aceite listas, tópicos ou enumerações soltas como resposta – a banca exige texto corrido
   
   ZERAMENTO TOTAL se:
   - Fuga ao tema
   - Ilegibilidade
   - Desrespeito ao comando da questão
   - Ausência de resposta

4. ESTRUTURA DA RESPOSTA (4 ENTREGAS OBRIGATÓRIAS):

   (1) CORREÇÃO TÉCNICA – Nota (0 a 50):
      - Explique ponto a ponto onde o candidato acertou e errou
      - Avalie domínio dos conceitos, precisão técnica e profundidade
      - Cite trechos específicos do texto
      - Justifique a nota atribuída

   (2) CORREÇÃO LINGUÍSTICA – Nota (0 a 50):
      - Corrija tudo: gramática, coesão, coerência, estrutura, clareza
      - Identifique todos os erros de ortografia, morfossintaxe, pontuação
      - Avalie adequação à norma culta
      - Justifique a nota atribuída

   (3) NOTA FINAL (0 a 100):
      - Soma das notas A + B
      - Mostre o cálculo: Nota Final = Domínio dos Conhecimentos Específicos + Uso da Língua Portuguesa

   (4) VERSÃO REESCRITA NOTA 100:
      - Reescreva o texto atingindo nota máxima
      - Mantenha o tema original
      - Use linguagem técnica adequada
      - Demonstre objetividade
      - Apresente argumentação madura
      - Mostre rigor conceitual
      - Garanta estrutura lógica completa (introdução → desenvolvimento → conclusão)

INSTRUÇÕES PARA A CORREÇÃO:
- Na "avaliacaoDetalhada", retorne EXATAMENTE 2 critérios:
  * Critério 1: "Domínio dos Conhecimentos Específicos" (0-50 pontos, peso 50%)
  * Critério 2: "Uso da Língua Portuguesa" (0-50 pontos, peso 50%)
- A "notaFinal" deve ser a SOMA das duas notas (máximo 100 pontos)
- Na "avaliacaoGeral", inclua a correção técnica detalhada
- Na seção de erros, liste todos os erros linguísticos encontrados
- No "textoCorrigido", forneça a versão reescrita nota 100
- IMPORTANTE: Seja rigoroso e técnico, seguindo exatamente os padrões da FGV` : (banca === 'Enem' || banca === 'ENEM') && criteriosEntrada.length === 0 ? `
OBRIGATÓRIO PARA ENEM: Retorne EXATAMENTE 5 competências do Enem na "avaliacaoDetalhada":
  1. Competência 1: Domínio da modalidade escrita formal da Língua Portuguesa (0-200)
  2. Competência 2: Compreender a proposta de redação e aplicar conceitos (0-200)
  3. Competência 3: Selecionar, relacionar, organizar e interpretar informações (0-200)
  4. Competência 4: Demonstrar conhecimento dos mecanismos linguísticos para argumentação (0-200)
  5. Competência 5: Elaborar proposta de intervenção respeitando direitos humanos (0-200)
- Cada competência deve ter máximo de 200 pontos e peso de 0.2 (20%)
- A nota final ("notaFinal") DEVE ser a SOMA EXATA das 5 competências (máximo 1000 pontos)
- Para cada competência, forneça feedback detalhado explicando a pontuação atribuída
- IMPORTANTE: Calcule "notaFinal" somando todas as pontuações de "avaliacaoDetalhada"` : criteriosEntrada.length === 0 ? `
- IMPORTANTE: Calcule "notaFinal" somando todas as pontuações de "avaliacaoDetalhada"
- A "notaFinal" deve ser um número maior que 0 e menor ou igual a ${notaMaxima}` : ''}

- Mantenha tom técnico de corretor oficial, mas seja pedagógico e encorajador`;

    console.log('🤖 Enviando requisição para Gemini API...');
    const inicioRequisicao = Date.now();

    // Usar o modelo que sabemos que funciona (baseado no código existente)
    // A biblioteca @google/genai usa modelos com nomes específicos
    let response;

    try {
        console.log('🤖 Enviando requisição para Gemini API...');

        // Usar o mesmo modelo que funciona em outras partes do código (gemini-2.5-flash)
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: correcaoSchema
            }
        });

        const tempoRequisicao = Date.now() - inicioRequisicao;
        console.log(`✅ Resposta recebida em ${tempoRequisicao}ms`);
    } catch (error: any) {
        console.error('❌ Erro na requisição ao Gemini:', error);

        // Mensagem mais útil para o usuário
        const mensagemErro = error?.error?.message || error?.message || 'Erro desconhecido';
        const codigoErro = error?.error?.code || error?.status || '';

        if (mensagemErro.includes('quota') || mensagemErro.includes('rate limit') || codigoErro === 429) {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (mensagemErro.includes('API key') || mensagemErro.includes('401') || mensagemErro.includes('403') || codigoErro === 401 || codigoErro === 403) {
            throw new Error('API Key inválida ou expirada. Verifique as credenciais do Gemini (VITE_GEMINI_API_KEY).');
        }
        if (mensagemErro.includes('model') || mensagemErro.includes('not found') || mensagemErro.includes('404') || codigoErro === 404) {
            throw new Error(`Modelo não encontrado (404). Verifique se a API Key está correta e se você tem acesso aos modelos do Gemini. Erro: ${mensagemErro}`);
        }
        throw new Error(`Erro ao comunicar com a IA: ${mensagemErro}`);
    }

    if (!response || !response.text) {
        throw new Error('Resposta vazia da IA. Tente novamente.');
    }

    console.log('📄 Processando resposta da IA...');
    let jsonText = response.text.trim().replace(/^```json\n?|```$/g, '');

    let resultado;
    try {
        resultado = JSON.parse(jsonText) as any;
        console.log('✅ JSON parseado com sucesso');
    } catch (parseError: any) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError);
        console.error('📄 Texto recebido (primeiros 500 chars):', jsonText.substring(0, 500));
        throw new Error(`Erro ao processar resposta da IA: ${parseError.message}`);
    }

    // Processar avaliação detalhada primeiro para calcular nota se necessário
    let avaliacaoDetalhadaProcessada = resultado.avaliacaoDetalhada?.map((item: any, index: number) => {
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
        // Normalizar o peso para garantir que esteja no formato decimal (0-1)
        let pesoNormalizado = item.peso ?? 0;
        if (pesoNormalizado > 1) {
            // Se o peso veio como percentual (ex: 70 ao invés de 0.70), normalizar
            pesoNormalizado = pesoNormalizado / 100;
        }
        return {
            criterio: item.criterio || '',
            pontuacao: item.pontuacao ?? 0,
            maximo: item.maximo ?? 0,
            peso: pesoNormalizado,
            feedback: item.feedback || ''
        };
    }) || [];


    // Validação e recálculo específico para Cebraspe
    if ((bancaNormalizada === 'Cebraspe' || banca === 'CESPE') && criteriosEntrada.length === 0) {
        // Calcular máximos proporcionais baseados na nota máxima definida
        // Proporções padrão Cebraspe: Conteúdo 70%, Estrutura 10%, Linguagem 20% (total 100%)
        const proporcoesCebraspe = [
            { nome: 'Conteúdo / Domínio Técnico', proporcao: 0.70 }, // 70%
            { nome: 'Estrutura Textual', proporcao: 0.10 }, // 10%
            { nome: 'Expressão Escrita / Gramática', proporcao: 0.20 } // 20%
        ];

        // Calcular máximos proporcionais
        const criteriosCebraspe = proporcoesCebraspe.map(c => ({
            nome: c.nome,
            maximo: Math.round(c.proporcao * notaMaxima * 100) / 100 // Arredondar para 2 casas decimais
        }));

        // Validar que há exatamente 3 critérios
        if (avaliacaoDetalhadaProcessada.length !== 3) {
            console.warn(`Cebraspe deve ter 3 critérios, mas encontrou ${avaliacaoDetalhadaProcessada.length}. Ajustando...`);

            // Se não há critérios ou estão incorretos, criar estrutura correta
            if (avaliacaoDetalhadaProcessada.length === 0) {
                avaliacaoDetalhadaProcessada = criteriosCebraspe.map((c, index) => ({
                    criterio: c.nome,
                    pontuacao: 0,
                    maximo: c.maximo,
                    peso: proporcoesCebraspe[index].proporcao,
                    feedback: 'Critério não avaliado pela IA. Recalcule a correção.'
                }));
            } else {
                // Ajustar máximos e nomes dos critérios existentes
                avaliacaoDetalhadaProcessada = avaliacaoDetalhadaProcessada.map((item: any, index: number) => {
                    const criterioEsperado = criteriosCebraspe[Math.min(index, criteriosCebraspe.length - 1)];
                    const proporcaoEsperada = proporcoesCebraspe[Math.min(index, proporcoesCebraspe.length - 1)].proporcao;

                    // Ajustar pontuação proporcionalmente se necessário
                    let pontuacaoAjustada = item.pontuacao || 0;
                    // Se a pontuação foi calculada com base em 100, ajustar proporcionalmente
                    if (item.maximo && item.maximo > 0 && item.maximo !== criterioEsperado.maximo) {
                        const fatorAjuste = criterioEsperado.maximo / item.maximo;
                        pontuacaoAjustada = pontuacaoAjustada * fatorAjuste;
                    }

                    return {
                        criterio: criterioEsperado.nome,
                        pontuacao: Math.min(Math.max(pontuacaoAjustada, 0), criterioEsperado.maximo),
                        maximo: criterioEsperado.maximo,
                        peso: proporcaoEsperada,
                        feedback: item.feedback || ''
                    };
                });

                // Garantir que há 3 critérios
                while (avaliacaoDetalhadaProcessada.length < 3) {
                    const index = avaliacaoDetalhadaProcessada.length;
                    const criterioEsperado = criteriosCebraspe[index];
                    const proporcaoEsperada = proporcoesCebraspe[index]?.proporcao || 0;
                    avaliacaoDetalhadaProcessada.push({
                        criterio: criterioEsperado.nome,
                        pontuacao: 0,
                        maximo: criterioEsperado.maximo,
                        peso: proporcaoEsperada,
                        feedback: 'Critério não avaliado pela IA.'
                    });
                }
            }
        }

        // Validar e ajustar máximos dos critérios (proporcionalmente)
        avaliacaoDetalhadaProcessada = avaliacaoDetalhadaProcessada.map((item: any, index: number) => {
            const criterioEsperado = criteriosCebraspe[index] || criteriosCebraspe[0];
            const proporcaoEsperada = proporcoesCebraspe[index]?.proporcao || proporcoesCebraspe[0].proporcao;

            // Ajustar pontuação se foi calculada com base em 100
            let pontuacaoAjustada = item.pontuacao || 0;
            if (item.maximo && item.maximo > 0 && item.maximo !== criterioEsperado.maximo) {
                // Se a IA retornou com base em 100, ajustar proporcionalmente
                const fatorAjuste = criterioEsperado.maximo / item.maximo;
                pontuacaoAjustada = pontuacaoAjustada * fatorAjuste;
            }

            return {
                criterio: criterioEsperado.nome,
                pontuacao: Math.min(Math.max(pontuacaoAjustada, 0), criterioEsperado.maximo),
                maximo: criterioEsperado.maximo,
                peso: proporcaoEsperada,
                feedback: item.feedback || ''
            };
        });

        // Recalcular nota final como soma dos 3 critérios (sempre para Cebraspe)
        const notaCalculadaCebraspe = avaliacaoDetalhadaProcessada.reduce((sum: number, item: any) => {
            return sum + (item.pontuacao || 0);
        }, 0);

        console.log(`📊 Cebraspe: Nota calculada dos critérios = ${notaCalculadaCebraspe.toFixed(2)}/${notaMaxima} (máximos proporcionais: ${criteriosCebraspe.map(c => c.maximo.toFixed(2)).join(', ')})`);
        notaFinalCalculada = notaCalculadaCebraspe;
    }

    // Calcular nota final: se há critérios de entrada, usar o calculado; senão, calcular da avaliação detalhada ou usar o retornado
    let notaFinalCalculadaFinal = notaFinalCalculada;

    if (criteriosEntrada.length === 0) {
        // Se a IA calculou, tentar usar a nota retornada, mas se for 0 ou inválida, calcular da avaliação detalhada
        const notaRetornada = resultado.notaFinal;

        // Calcular nota a partir dos critérios (sempre fazer isso como validação)
        const notaCalculadaDosCriterios = avaliacaoDetalhadaProcessada.reduce((sum: number, item: any) => {
            return sum + (item.pontuacao || 0);
        }, 0);

        // Para Cebraspe, sempre usar a nota calculada dos critérios
        if (bancaNormalizada === 'Cebraspe' || banca === 'CESPE') {
            notaFinalCalculadaFinal = notaCalculadaDosCriterios;
            console.log(`✅ Cebraspe: Usando nota calculada dos critérios = ${notaFinalCalculadaFinal}`);
        } else {
            // Para outras bancas, usar lógica de tolerância
            // Usar a nota retornada se for válida e próxima da calculada (tolerância de 5%)
            if (notaRetornada && notaRetornada > 0) {
                const diferenca = Math.abs(notaRetornada - notaCalculadaDosCriterios);
                const tolerancia = notaMaxima * 0.05; // 5% de tolerância

                if (diferenca <= tolerancia) {
                    notaFinalCalculadaFinal = notaRetornada;
                } else {
                    // Se houver grande diferença, usar a calculada (mais confiável)
                    console.warn(`Nota retornada (${notaRetornada}) difere muito da calculada (${notaCalculadaDosCriterios}). Usando a calculada.`);
                    notaFinalCalculadaFinal = notaCalculadaDosCriterios;
                }
            } else {
                // Se não retornou nota ou retornou 0, usar a calculada
                notaFinalCalculadaFinal = notaCalculadaDosCriterios;
            }
        }

        // Garantir que a nota não seja zero se há critérios avaliados
        if (notaFinalCalculadaFinal === 0 && avaliacaoDetalhadaProcessada.length > 0) {
            console.warn('Nota final calculada como 0, mas há critérios avaliados. Recalculando...');
            notaFinalCalculadaFinal = notaCalculadaDosCriterios;
        }
    }

    // Manter a nota máxima definida pelo usuário (não forçar 100 para Cebraspe)
    let notaMaximaFinal = notaMaxima;

    // Validação final: garantir que a nota está dentro dos limites
    if (notaFinalCalculadaFinal < 0) {
        console.warn('Nota final negativa, ajustando para 0');
        notaFinalCalculadaFinal = 0;
    }
    if (notaFinalCalculadaFinal > notaMaximaFinal) {
        console.warn(`Nota final (${notaFinalCalculadaFinal}) excede o máximo (${notaMaximaFinal}), ajustando...`);
        notaFinalCalculadaFinal = notaMaximaFinal;
    }

    const correcaoCompleta: CorrecaoCompleta = {
        banca: bancaNormalizada,
        notaMaxima: notaMaximaFinal,
        notaFinal: notaFinalCalculadaFinal,
        avaliacaoGeral: resultado.avaliacaoGeral || '',
        comentariosGerais: resultado.comentariosGerais || '',
        sinteseFinal: resultado.sinteseFinal || '',
        textoCorrigido: resultado.textoCorrigido || undefined,
        errosDetalhados: resultado.errosDetalhados || [],
        avaliacaoDetalhada: avaliacaoDetalhadaProcessada
    };

    // Log final para debug (Cebraspe)
    if ((bancaNormalizada === 'Cebraspe' || banca === 'CESPE') && criteriosEntrada.length === 0) {
        console.log('📋 Cebraspe - Resumo da correção:');
        console.log(`  - Nota máxima definida: ${notaMaxima}`);
        console.log(`  - Critérios avaliados: ${avaliacaoDetalhadaProcessada.length}`);
        avaliacaoDetalhadaProcessada.forEach((item: any, index: number) => {
            console.log(`  - ${item.criterio}: ${item.pontuacao.toFixed(2)}/${item.maximo.toFixed(2)} pontos (${(item.peso * 100).toFixed(0)}%)`);
        });
        console.log(`  - Nota Final: ${notaFinalCalculadaFinal.toFixed(2)}/${notaMaximaFinal}`);
    }

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

/**
 * Gera alternativas plausíveis para um quiz baseado em um flashcard usando IA
 * @param pergunta A pergunta do flashcard
 * @param respostaCorreta A resposta correta
 * @returns Array com 3 alternativas incorretas mas plausíveis
 */
export const gerarAlternativasQuiz = async (
    pergunta: string,
    respostaCorreta: string
): Promise<{ options: string[], explanation: string }> => {
    if (!ai || !apiKey) {
        throw new Error('API Key do Gemini não configurada. Configure a variável VITE_GEMINI_API_KEY no arquivo .env');
    }

    const prompt = `Você é um especialista em criar questões de múltipla escolha para estudos e concursos, com foco no estilo da banca FGV (Fundação Getúlio Vargas).

TAREFA: Gere 3 alternativas INCORRETAS mas PLAUSÍVEIS para a seguinte questão de flashcard e forneça uma breve explicação do porquê a resposta correta é a correta.

ESTILO FGV:
- As alternativas devem ser longas e detalhadas, se a resposta correta também for.
- Use vocabulário técnico e preciso.
- Crie "distratores" que explorem exceções ou casos específicos.

PERGUNTA: ${pergunta}
RESPOSTA CORRETA: ${respostaCorreta}

INSTRUÇÕES CRÍTICAS:
1. As alternativas devem ser CONTEXTUALMENTE RELEVANTES à pergunta.
2. Devem ser PLAUSÍVEIS, mas CLARAMENTE INCORRETAS para quem estudou o assunto.
3. EVITE "pegadinhas" excessivamente complexas ou minuciosas.
4. As alternativas devem ser FRASES COMPLETAS e gramaticalmente corretas (não corte frases no meio).
5. Mantenha o MESMO ESTILO e FORMATO da resposta correta (se a resposta é uma data, as alternativas devem ser datas; se é uma frase, devem ser frases).
6. O comprimento das alternativas deve ser similar ao da resposta correta.
6. O comprimento das alternativas deve ser similar ao da resposta correta.
7. Forneça uma EXPLICAÇÃO CONCISA (máximo 2 frases) sobre o porquê a resposta correta é a correta e por que as outras podem confundir.
8. SEJA CONCISO: Evite textos desnecessariamente longos. As alternativas devem ser diretas.

O QUE EVITAR:
- Não use alternativas genéricas como "Nenhuma das anteriores".
- Não repita a resposta correta.
- Não crie alternativas absurdas ou engraçadas.
- Não deixe as frases incompletas ou sem sentido.

FORMATO DE SAÍDA:
Retorne APENAS um objeto JSON com o seguinte formato:
{
  "options": ["alternativa 1", "alternativa 2", "alternativa 3"],
  "explanation": "Breve explicação do contexto da resposta correta."
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        let jsonText = response.text.trim();

        // Limpar possíveis markdown
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/```$/g, '').trim();

        // Parse do JSON
        const result = JSON.parse(jsonText);

        // Validar formato
        const options = result.options;
        const explanation = result.explanation || "Explicação não disponível.";

        // Validar que recebemos um array com 3 strings
        if (!Array.isArray(options) || options.length !== 3) {
            console.warn('IA retornou formato inválido, gerando alternativas genéricas');
            return {
                options: [
                    `Alternativa relacionada a ${pergunta.substring(0, 20)}... (1)`,
                    `Alternativa relacionada a ${pergunta.substring(0, 20)}... (2)`,
                    `Alternativa relacionada a ${pergunta.substring(0, 20)}... (3)`
                ],
                explanation: "Não foi possível gerar uma explicação detalhada."
            };
        }

        // Garantir que todas são strings não vazias
        const alternativasValidas = options
            .filter((alt: any) => typeof alt === 'string' && alt.trim().length > 0)
            .map((alt: any) => alt.trim());

        if (alternativasValidas.length < 3) {
            console.warn('Algumas alternativas inválidas, completando com genéricas');
            while (alternativasValidas.length < 3) {
                alternativasValidas.push(`Opção ${alternativasValidas.length + 1}`);
            }
        }

        return {
            options: alternativasValidas.slice(0, 3),
            explanation
        };

    } catch (error: any) {
        console.error('Erro ao gerar alternativas com IA:', error);

        // Em caso de erro, retornar alternativas genéricas
        return {
            options: [
                `Alternativa 1 relacionada ao tema`,
                `Alternativa 2 relacionada ao tema`,
                `Alternativa 3 relacionada ao tema`
            ],
            explanation: "Não foi possível gerar uma explicação devido a um erro de conexão."
        };
    }
};

/**
 * Gera uma questão de Certo/Errado baseada em um flashcard
 */
export const gerarQuestaoCertoErrado = async (
    pergunta: string,
    respostaCorreta: string
): Promise<{ statement: string; isCorrect: boolean; explanation: string }> => {
    if (!ai || !apiKey) {
        throw new Error('API Key do Gemini não configurada. Configure a variável VITE_GEMINI_API_KEY no arquivo .env');
    }

    const prompt = `Você é um especialista em criar questões de concurso no estilo Certo/Errado, especificamente no padrão CEBRASPE (Cespe/UnB).

TAREFA: Transforme a pergunta e resposta abaixo em uma AFIRMAÇÃO (sentença declarativa) para ser julgada como CERTA ou ERRADA.
Decida aleatoriamente se a afirmação será VERDADEIRA (baseada na resposta correta) ou FALSA (baseada em uma alternativa incorreta plausível).
Forneça também uma breve explicação.

ESTILO CEBRASPE:
- Use linguagem técnica e assertiva.
- Explore jurisprudência e doutrina quando aplicável.
- Crie itens que exijam interpretação e não apenas decoreba.
- Se for criar um item ERRADO, use a técnica de "extrapolação" ou "inversão de conceito" de forma sutil.

PERGUNTA: ${pergunta}
RESPOSTA CORRETA: ${respostaCorreta}

INSTRUÇÕES:
1. A afirmação deve ser clara, objetiva e direta.
2. Se for FALSA, altere um detalhe crucial da resposta correta para torná-la incorreta, mas ainda plausível (não crie absurdos).
3. Se for VERDADEIRA, reformule a pergunta e resposta como uma afirmação correta.
4. Forneça uma EXPLICAÇÃO CONCISA (máximo 2 frases) justificando o gabarito.
5. SEJA CONCISO: A afirmação deve ser curta e objetiva, ideal para leitura rápida.

FORMATO DE SAÍDA (JSON):
{
  "statement": "A frase afirmativa gerada",
  "isCorrect": true ou false,
  "explanation": "Breve justificativa do gabarito."
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        let jsonText = response.text.trim();
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/```$/g, '').trim();

        const result = JSON.parse(jsonText);

        return {
            statement: result.statement || `${pergunta} - ${respostaCorreta}`,
            isCorrect: typeof result.isCorrect === 'boolean' ? result.isCorrect : true,
            explanation: result.explanation || "Explicação não disponível."
        };

    } catch (error: any) {
        console.error('Erro ao gerar questão Certo/Errado:', error);
        return {
            statement: `${pergunta} A resposta é ${respostaCorreta}.`,
            isCorrect: true,
            explanation: "Não foi possível gerar uma explicação detalhada."
        };
    }
};

/**
 * Busca questões reais de concursos na internet de uma banca específica
 */
async function buscarQuestoesNaInternet(
    banca: string,
    disciplina: string,
    mode: 'standard' | 'true_false'
): Promise<string | null> {
    try {
        const tipoQuestao = mode === 'true_false' ? 'certo errado' : 'múltipla escolha';
        const searchQuery = `${banca} questões ${disciplina} ${tipoQuestao} concurso público`;

        // Usar fetch para buscar na internet (simulação - em produção usaria uma API de busca)
        // Por enquanto, vamos usar a IA para buscar e processar questões
        return null; // Retorna null para usar fallback da IA com contexto de busca
    } catch (error) {
        console.error('Erro ao buscar questões na internet:', error);
        return null;
    }
}

/**
 * Gera um quiz completo (pergunta, resposta e alternativas) a partir de um tema/disciplina
 * Usado quando o usuário não tem flashcards suficientes.
 * Agora busca questões reais de bancas específicas na internet.
 */
export const gerarQuizPorDisciplina = async (
    disciplina: string,
    mode: 'standard' | 'true_false',
    banca?: string,
    topico?: string
): Promise<{ question: string; options: string[]; correctAnswer: string; explanation: string }> => {
    if (!ai || !apiKey) {
        throw new Error('API Key do Gemini não configurada.');
    }

    const estilo = mode === 'true_false' ? 'CEBRASPE (Certo/Errado)' : (banca || 'FGV') + ' (Múltipla Escolha)';

    // Construir contexto de busca
    let contextoBusca = '';
    if (banca) {
        contextoBusca = `\n\nIMPORTANTE: Busque e baseie-se em questões REAIS e DIVERSAS de concursos públicos da banca ${banca}. 
A questão deve seguir EXATAMENTE o estilo e padrão de questões que essa banca utiliza em seus concursos.
DIVERSIFIQUE os temas - não foque apenas em um tipo de conteúdo (ex: não apenas jurisprudência do STF).
Evite criar questões genéricas ou que não sejam típicas dessa banca.`;

        if (topico) {
            contextoBusca += `\nFoque especificamente no tópico: ${topico}`;
        }
    }

    const prompt = `Você é um examinador de banca de concursos experiente com acesso a questões reais de concursos públicos.
    
TAREFA: Crie uma questão baseada em questões REAIS e DIVERSAS de concursos públicos sobre a disciplina: "${disciplina}".
ESTILO: ${estilo}${contextoBusca}

INSTRUÇÕES CRÍTICAS:
1. A questão DEVE ser baseada em questões REAIS de concursos públicos da banca especificada (se houver).
2. DIVERSIFIQUE os tipos de conteúdo: legislação, doutrina, jurisprudência (de diversos tribunais, não apenas STF), conceitos teóricos, casos práticos, etc.
3. EVITE focar apenas em jurisprudência do STF - varie entre diferentes fontes e tipos de conhecimento.
4. A questão deve abordar conteúdos que REALMENTE caem em concursos públicos, não conteúdos acadêmicos genéricos.
5. Se for CEBRASPE: Crie uma afirmação para julgamento (Certo ou Errado) no estilo característico dessa banca.
6. Se for múltipla escolha: Crie uma pergunta com 4 alternativas (1 correta e 3 incorretas plausíveis) no estilo da banca.
7. Forneça uma explicação detalhada do gabarito baseada em legislação, doutrina ou jurisprudência quando aplicável, mas VARIE as fontes.
8. SEJA CONCISO: O enunciado não deve ser um texto gigante. Foque no essencial para avaliar o conhecimento.
9. EVITE conteúdos que não são típicos de concursos públicos (ex: teorias muito acadêmicas, assuntos que não caem em prova).
10. Priorize conteúdos que são FREQUENTEMENTE cobrados em concursos da banca especificada, mas com DIVERSIDADE de temas.
11. REGRA CRÍTICA DE DIVERSIFICAÇÃO: Se a disciplina for Direito ou áreas jurídicas, você DEVE variar entre:
    - Legislação (leis, decretos, portarias, normas) - PRIORIZE ESTE TIPO
    - Doutrina (autores e teorias consolidadas) - PRIORIZE ESTE TIPO
    - Princípios constitucionais e administrativos - PRIORIZE ESTE TIPO
    - Casos práticos e aplicação da lei - PRIORIZE ESTE TIPO
    - Teoria geral e conceitos fundamentais - PRIORIZE ESTE TIPO
    - Jurisprudência de outros tribunais (STJ, TST, TRF, TRT, TJ, etc.) - USE COM MODERAÇÃO
    - Jurisprudência do STF - USE APENAS OCASIONALMENTE, NÃO FOQUE NISSO
12. NÃO crie questões que sejam APENAS sobre jurisprudência do STF. Se usar jurisprudência, combine com outros elementos (legislação, doutrina, princípios).
13. Para cada questão gerada, escolha ALEATORIAMENTE um tipo de fonte diferente da anterior para garantir diversidade.

${banca ? `ESTILO ESPECÍFICO DA BANCA ${banca}:
- Siga o padrão de questões dessa banca
- Use a terminologia e abordagem característica dessa banca
- Questões devem ser similares às questões reais dessa banca
- VARIE os temas e tipos de questões` : ''}

FORMATO DE SAÍDA (JSON):
{
  "question": "O texto da pergunta ou afirmação",
  "options": ["Opção A", "Opção B", "Opção C", "Opção D"] (Se for Certo/Errado, use ["Certo", "Errado"]),
  "correctAnswer": "A resposta correta exata (deve estar nas options)",
  "explanation": "Justificativa do gabarito com referências quando aplicável"
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        let jsonText = response.text.trim();
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/```$/g, '').trim();

        const result = JSON.parse(jsonText);

        // Validação básica
        if (!result.question || !result.correctAnswer || !Array.isArray(result.options)) {
            throw new Error('Formato de resposta inválido da IA');
        }

        return {
            question: result.question,
            options: result.options,
            correctAnswer: result.correctAnswer,
            explanation: result.explanation || "Gabarito comentado não disponível."
        };

    } catch (error) {
        console.error('Erro ao gerar quiz por disciplina:', error);
        // Fallback genérico
        return {
            question: `Não foi possível gerar uma questão específica de ${disciplina} neste momento. Tente novamente.`,
            options: ["Tentar novamente"],
            correctAnswer: "Tentar novamente",
            explanation: "Erro de conexão com a IA."
        };
    }
};

/**
 * Gera um lote de questões de quiz de uma só vez
 */
/**
 * Gera um lote de questões de quiz de uma só vez
 */
export const gerarBatchQuiz = async (
    disciplina: string,
    mode: 'standard' | 'true_false',
    questionCount: number,
    banca?: string,
    topicos?: Array<{ id: string; titulo: string }>,
    difficulty: 'Fácil' | 'Médio' | 'Difícil' = 'Médio'
): Promise<Array<{ question: string; options: string[]; correctAnswer: string; explanation: string }>> => {
    if (!ai || !apiKey) {
        throw new Error('API Key do Gemini não configurada.');
    }

    const estilo = mode === 'true_false' ? 'Certo/Errado (Estilo Cebraspe)' : 'Múltipla Escolha (4 alternativas)';

    // Construir string de tópicos com instrução explícita de limitação
    let topicosStr = '';
    if (topicos && topicos.length > 0) {
        const titulosTopicos = topicos.map(t => t.titulo).join(', ');
        topicosStr = `
TÓPICOS SELECIONADOS: ${titulosTopicos}

⚠️ IMPORTANTE - LIMITAÇÃO CRÍTICA:
- Crie questões APENAS sobre os tópicos listados acima
- NÃO crie questões sobre outros assuntos da disciplina "${disciplina}"
- Todas as ${questionCount} questões devem estar relacionadas aos tópicos selecionados
- Se um tópico for muito específico, explore diferentes aspectos dele`;
    } else {
        topicosStr = 'Tópicos variados dentro da disciplina';
    }

    const prompt = `Você é um examinador de banca de concursos experiente.
    
TAREFA: Crie ${questionCount} questões de concursos públicos sobre a disciplina: "${disciplina}".
MODO: ${estilo}
NÍVEL DE DIFICULDADE: ${difficulty}
${topicosStr}
${banca ? `BANCA: ${banca}` : ''}

INSTRUÇÕES CRÍTICAS DE ESTILO:
1. SEJA DIRETO E SUSCINTO: Enunciados curtos e objetivos. Sem textos longos ou enrolação.
2. FOCO EM VELOCIDADE: O aluno deve conseguir ler e responder rápido.
3. DIFICULDADE (${difficulty.toUpperCase()}):
   ${difficulty === 'Fácil' ? '- Questões diretas, cobrando conceitos fundamentais e definições básicas.\n   - Evite pegadinhas complexas.\n   - Alternativas incorretas devem ser claramente erradas.' : ''}
   ${difficulty === 'Médio' ? '- Questões que exigem compreensão e aplicação dos conceitos.\n   - Pode incluir casos práticos simples.\n   - Alternativas incorretas devem ser plausíveis.' : ''}
   ${difficulty === 'Difícil' ? '- Questões complexas, exigindo análise crítica, jurisprudência ou detalhes técnicos.\n   - Use casos práticos mais elaborados ou exceções à regra.\n   - Alternativas incorretas devem ser muito próximas da correta (distratores fortes).' : ''}
4. ${mode === 'true_false' ? 'Para Certo/Errado: Gere afirmações diretas.' : 'Para Múltipla Escolha: Gere enunciados curtos e 4 alternativas curtas.'}

FORMATO DE SAÍDA (JSON ARRAY):
[
  {
    "question": "Enunciado curto e direto",
    "options": ${mode === 'true_false' ? '["Certo", "Errado"]' : '["Opção A", "Opção B", "Opção C", "Opção D"]'},
    "correctAnswer": "A resposta correta exata",
    "explanation": "Explicação ultra-resumida (max 1 frase)."
  }
]`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        let jsonText = response.text.trim();
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/```$/g, '').trim();

        const result = JSON.parse(jsonText);

        if (!Array.isArray(result)) {
            throw new Error('Formato de resposta inválido da IA (não é array)');
        }

        return result.map((q: any) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "Sem explicação."
        }));

    } catch (error) {
        console.error('Erro ao gerar batch quiz:', error);
        throw new Error('Falha ao gerar questões do quiz.');
    }
};


// Schema para geração de flashcards
const flashcardsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            pergunta: { type: Type.STRING },
            resposta: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    }
};

/**
 * Gera flashcards usando IA baseado em um tópico
 */
export const gerarFlashcardsIA = async (
    tema: string,
    quantidade: number = 5,
    dificuldade: string = 'médio'
): Promise<Partial<Flashcard>[]> => {
    if (!ai) {
        console.error('❌ Tentativa de gerar flashcards sem API Key configurada');
        throw new Error('API Key do Gemini não detectada. Se você está no Vercel, verifique se a variável VITE_GEMINI_API_KEY foi adicionada nas configurações e se foi feito um REDEPLOY após a adição.');
    }

    if (!tema || tema.trim().length === 0) {
        throw new Error('O tema não pode estar vazio.');
    }

    if (quantidade < 1 || quantidade > 50) {
        throw new Error('A quantidade deve estar entre 1 e 50 flashcards.');
    }

    const prompt = `Você é um especialista em criar material de estudo eficaz.
Crie exatamente ${quantidade} flashcards sobre o tema: "${tema}".
Nível de dificuldade: ${dificuldade}.

INSTRUÇÕES IMPORTANTES:
1. Cada flashcard deve ter uma pergunta clara e objetiva
2. A resposta deve ser precisa, concisa e educativa
3. Adicione 1-3 tags relevantes para cada card (máximo 3)
4. Foque nos conceitos mais importantes e fundamentais do tema
5. As perguntas devem testar compreensão, não apenas memorização
6. Use linguagem clara e adequada ao nível de dificuldade especificado

Retorne APENAS um array JSON válido, sem texto adicional antes ou depois.`;

    try {
        console.log(`🤖 Gerando ${quantidade} flashcards sobre "${tema}" (dificuldade: ${dificuldade})...`);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        if (!response || !response.text) {
            throw new Error('Resposta vazia da IA.');
        }

        let jsonText = response.text.trim();
        // Remove markdown code blocks se presentes
        jsonText = jsonText.replace(/^```json\n?|```$/g, '').trim();

        let flashcards;
        try {
            flashcards = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError);
            console.error('Texto recebido:', jsonText.substring(0, 500));
            throw new Error('Resposta da IA em formato inválido. Tente novamente.');
        }

        if (!Array.isArray(flashcards)) {
            throw new Error('A IA não retornou um array de flashcards.');
        }

        if (flashcards.length === 0) {
            throw new Error('Nenhum flashcard foi gerado.');
        }

        const validFlashcards = flashcards
            .filter((fc: any) => fc && fc.pergunta && fc.resposta)
            .map((fc: any) => ({
                pergunta: String(fc.pergunta).trim(),
                resposta: String(fc.resposta).trim(),
                tags: Array.isArray(fc.tags)
                    ? [...fc.tags.slice(0, 3).map((t: any) => String(t).trim()), 'Gerado por IA']
                    : ['Gerado por IA']
            }));

        if (validFlashcards.length === 0) {
            throw new Error('Nenhum flashcard válido foi gerado.');
        }

        console.log(`✅ ${validFlashcards.length} flashcards gerados com sucesso`);
        return validFlashcards;
    } catch (error: any) {
        console.error('Erro ao gerar flashcards por tópico:', error);

        const mensagemErro = error?.error?.message || error?.message || 'Erro desconhecido';
        const codigoErro = error?.error?.code || error?.status || '';

        if (mensagemErro.includes('quota') || mensagemErro.includes('rate limit') || codigoErro === 429) {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (mensagemErro.includes('API key') || mensagemErro.includes('401') || mensagemErro.includes('403') || codigoErro === 401 || codigoErro === 403) {
            throw new Error('API Key inválida ou expirada. Verifique VITE_GEMINI_API_KEY.');
        }
        if (mensagemErro.includes('model') || mensagemErro.includes('not found') || codigoErro === 404) {
            throw new Error('Modelo não encontrado. Verifique se a API Key está correta.');
        }

        throw error instanceof Error ? error : new Error(`Falha ao gerar flashcards: ${mensagemErro}`);
    }
};

/**
 * Gera flashcards usando IA baseado em um texto fornecido
 */
export const gerarFlashcardsPorTexto = async (
    texto: string,
    quantidade: number = 5
): Promise<Partial<Flashcard>[]> => {
    if (!ai) {
        console.error('❌ Tentativa de gerar flashcards por texto sem API Key configurada');
        throw new Error('API Key do Gemini não detectada. Se você está no Vercel, verifique se a variável VITE_GEMINI_API_KEY foi adicionada nas configurações e se foi feito um REDEPLOY após a adição.');
    }

    if (!texto || texto.trim().length === 0) {
        throw new Error('O texto não pode estar vazio.');
    }

    if (texto.trim().length < 50) {
        throw new Error('O texto deve ter pelo menos 50 caracteres para gerar flashcards relevantes.');
    }

    if (quantidade < 1 || quantidade > 50) {
        throw new Error('A quantidade deve estar entre 1 e 50 flashcards.');
    }

    // Limita o texto a 10000 caracteres para evitar problemas com tokens
    const textoLimitado = texto.substring(0, 10000).trim();

    const prompt = `Você é um especialista em criar material de estudo eficaz.
Analise cuidadosamente o texto abaixo e crie aproximadamente ${quantidade} flashcards cobrindo os pontos principais e conceitos importantes.

TEXTO FORNECIDO:
"""
${textoLimitado}
"""

INSTRUÇÕES CRÍTICAS DE FILTRAGEM (O QUE IGNORAR):
1. IGNORAR METODOLOGIA: NÃO crie cards sobre como o curso funciona, "metodologia de ensino", "objetivos do curso", "dicas de estudo" ou "responsabilidades do professor/aluno".
2. IGNORAR APRESENTAÇÃO: Ignore textos introdutórios, boas-vindas, marketing ou promessas do curso.
3. IGNORAR FONTES: NÃO mencione nomes de autores, professores, arquivos ou instituições.

INSTRUÇÕES DE QUALIDADE (O QUE FAZER):
1. FOCO TÉCNICO: Crie cards APENAS sobre a MATÉRIA em si (ex: Conceitos de Direito, Regras de Português, Fórmulas de Matemática, Fatos Históricos).
2. DIRETO AO PONTO: A pergunta deve ser objetiva (ex: "O que caracteriza o crime X?", "Qual a regra de crase para Y?") e a resposta deve ser a definição técnica.
3. CONTEXTO AUTÔNOMO: O flashcard deve ser útil para qualquer pessoa estudando a matéria, mesmo sem ter lido o texto original.

INSTRUÇÕES GERAIS:
1. Crie perguntas baseadas EXCLUSIVAMENTE no conteúdo TÉCNICO do texto
2. As respostas devem ser precisas, completas e extraídas do texto
3. Adicione 1-3 tags relevantes para cada card (máximo 3)
4. Se o texto for APENAS uma apresentação de curso sem conteúdo técnico, gere apenas 1 card avisando: "Pergunta: Este texto contém conteúdo técnico? Resposta: O texto parece ser apenas uma apresentação/intro. Por favor, importe um material com conteúdo da matéria."

Retorne APENAS um array JSON válido, sem texto adicional antes ou depois.`;

    try {
        console.log(`🤖 Gerando ~${quantidade} flashcards a partir de texto (${textoLimitado.length} caracteres)...`);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        if (!response || !response.text) {
            throw new Error('Resposta vazia da IA.');
        }

        let jsonText = response.text.trim();
        // Remove markdown code blocks se presentes
        jsonText = jsonText.replace(/^```json\n?|```$/g, '').trim();

        let flashcards;
        try {
            flashcards = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Erro ao fazer parse do JSON:', parseError);
            console.error('Texto recebido:', jsonText.substring(0, 500));
            throw new Error('Resposta da IA em formato inválido. Tente novamente.');
        }

        if (!Array.isArray(flashcards)) {
            throw new Error('A IA não retornou um array de flashcards.');
        }

        if (flashcards.length === 0) {
            throw new Error('Nenhum flashcard foi gerado a partir do texto.');
        }

        const validFlashcards = flashcards
            .filter((fc: any) => fc && fc.pergunta && fc.resposta)
            .map((fc: any) => ({
                pergunta: String(fc.pergunta).trim(),
                resposta: String(fc.resposta).trim(),
                tags: Array.isArray(fc.tags)
                    ? [...fc.tags.slice(0, 3).map((t: any) => String(t).trim()), 'Gerado por IA']
                    : ['Gerado por IA']
            }));

        if (validFlashcards.length === 0) {
            throw new Error('Nenhum flashcard válido foi gerado a partir do texto.');
        }

        console.log(`✅ ${validFlashcards.length} flashcards gerados com sucesso a partir do texto`);
        return validFlashcards;
    } catch (error: any) {
        console.error('Erro ao gerar flashcards por texto:', error);

        const mensagemErro = error?.error?.message || error?.message || 'Erro desconhecido';
        const codigoErro = error?.error?.code || error?.status || '';

        if (mensagemErro.includes('quota') || mensagemErro.includes('rate limit') || codigoErro === 429) {
            throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }
        if (mensagemErro.includes('API key') || mensagemErro.includes('401') || mensagemErro.includes('403') || codigoErro === 401 || codigoErro === 403) {
            throw new Error('API Key inválida ou expirada. Verifique VITE_GEMINI_API_KEY.');
        }
        if (mensagemErro.includes('model') || mensagemErro.includes('not found') || codigoErro === 404) {
            throw new Error('Modelo não encontrado. Verifique se a API Key está correta.');
        }

        throw error instanceof Error ? error : new Error(`Falha ao gerar flashcards: ${mensagemErro}`);
    }
};


// Schema para estrutura de edital extraída
// Nota: O Gemini requer que todos os objetos tenham propriedades definidas explicitamente
const editalExtracaoSchema = {
    type: Type.OBJECT,
    properties: {
        meta: {
            type: Type.OBJECT,
            properties: {
                orgao: { type: Type.STRING },
                cargo: { type: Type.STRING },
                versao: { type: Type.STRING }
            }
        },
        disciplinas: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    nome: { type: Type.STRING },
                    conteudo: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                indice: { type: Type.STRING },
                                titulo: { type: Type.STRING },
                                tipo: { type: Type.STRING },
                                filhos: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            indice: { type: Type.STRING },
                                            titulo: { type: Type.STRING },
                                            tipo: { type: Type.STRING },
                                            filhos: {
                                                type: Type.ARRAY,
                                                items: {
                                                    type: Type.OBJECT,
                                                    properties: {
                                                        indice: { type: Type.STRING },
                                                        titulo: { type: Type.STRING },
                                                        tipo: { type: Type.STRING },
                                                        filhos: {
                                                            type: Type.ARRAY,
                                                            items: {
                                                                type: Type.OBJECT,
                                                                properties: {
                                                                    titulo: { type: Type.STRING },
                                                                    tipo: { type: Type.STRING }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

/**
 * Processa texto bruto de edital e extrai automaticamente disciplinas e tópicos usando IA
 * @param textoEdital Texto bruto do edital (pode ser copiado de PDF ou documento)
 * @returns JSON estruturado no formato hierárquico do sistema
 */
export const processarTextoEdital = async (textoEdital: string): Promise<any> => {
    if (!ai) {
        throw new Error('API Key do Gemini não configurada. Configure a variável GEMINI_API_KEY no arquivo .env');
    }

    if (!textoEdital || textoEdital.trim().length < 50) {
        throw new Error('Texto do edital muito curto. Forneça pelo menos 50 caracteres.');
    }

    const prompt = `Você é um especialista em processar editais de concursos públicos. Analise o texto do edital fornecido e extraia todas as disciplinas e seus respectivos tópicos/subtópicos/itens.

TEXTO DO EDITAL:
${textoEdital}

INSTRUÇÕES:
1. Identifique o órgão, cargo e outras informações relevantes do edital
2. Extraia TODAS as disciplinas mencionadas no edital
3. Para cada disciplina, identifique a estrutura completa de conteúdo:
   - Tópicos principais (com índices numéricos se disponíveis, ex: "1", "2", "10")
   - Subtópicos (com índices como "1.1", "1.2", etc.)
   - Itens específicos (com índices como "1.1.1", "1.1.2", etc.)
4. Preserve a hierarquia e numeração quando disponível
5. Se não houver numeração clara, crie uma estrutura lógica baseada no texto
6. Mantenha os títulos exatamente como aparecem no edital (sem alterações)

FORMATO DE SAÍDA:
Retorne APENAS um JSON válido no seguinte formato:
{
  "meta": {
    "orgao": "Nome do órgão",
    "cargo": "Nome do cargo",
    "versao": "1.0"
  },
  "disciplinas": [
    {
      "nome": "Nome da Disciplina",
      "conteudo": [
        {
          "indice": "1",
          "titulo": "Título do Tópico",
          "tipo": "topico",
          "filhos": [
            {
              "indice": "1.1",
              "titulo": "Título do Subtópico",
              "tipo": "subtopico",
              "filhos": [
                {
                  "titulo": "Item específico",
                  "tipo": "item"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANTE:
- Seja preciso e completo - extraia TODAS as disciplinas e tópicos
- Preserve a estrutura hierárquica quando clara
- Se o texto não tiver estrutura clara, crie uma organização lógica
- Use "topico" para tópicos principais, "subtopico" para subtópicos, "item" para itens específicos
- Mantenha os índices quando disponíveis no texto original
- Se não houver índices, você pode omitir o campo "indice"`;

    try {
        // Usar prompt sem schema restritivo para evitar problemas de validação
        const promptFinal = `${prompt}

IMPORTANTE: 
- Retorne APENAS um JSON válido, sem markdown, sem código, sem explicações
- O JSON deve começar com { e terminar com }
- Se uma disciplina não tiver conteúdo, retorne um array vazio []
- Se um item não tiver filhos, retorne um array vazio [] ou omita o campo
- Garanta que TODAS as disciplinas sejam extraídas do texto`;

        // Solicitar resposta em JSON
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: promptFinal,
            config: {
                responseMimeType: 'application/json'
            }
        });

        let jsonText = response.text.trim();

        // Verificar se a resposta parece estar truncada
        if (jsonText && !jsonText.endsWith('}') && !jsonText.endsWith(']')) {
            console.warn('Resposta da IA pode estar truncada. Tentando processar mesmo assim...');
            // Tentar encontrar o último objeto/array válido
            const lastOpenBrace = jsonText.lastIndexOf('{');
            const lastOpenBracket = jsonText.lastIndexOf('[');
            const lastClose = Math.max(jsonText.lastIndexOf('}'), jsonText.lastIndexOf(']'));

            if (lastOpenBrace > lastClose) {
                // JSON incompleto - tentar fechar
                const openCount = (jsonText.substring(0, lastOpenBrace + 1).match(/\{/g) || []).length;
                const closeCount = (jsonText.match(/\}/g) || []).length;
                const missing = openCount - closeCount;
                if (missing > 0) {
                    jsonText = jsonText + '\n' + '}'.repeat(missing);
                }
            }
        }

        // Limpar possíveis markdown ou código
        jsonText = jsonText.replace(/^```json\n?/i, '').replace(/^```\n?/i, '').replace(/```$/g, '').trim();

        // Tentar parse do JSON
        let resultado;
        try {
            resultado = JSON.parse(jsonText);
        } catch (parseError: any) {
            console.warn('Erro ao fazer parse direto do JSON:', parseError.message);
            console.warn('Texto recebido (primeiros 1000 chars):', jsonText.substring(0, 1000));

            // Se falhar, tentar extrair JSON do texto
            let jsonMatch = jsonText.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                // Tentar encontrar JSON que pode estar incompleto
                const openBraces = (jsonText.match(/\{/g) || []).length;
                const closeBraces = (jsonText.match(/\}/g) || []).length;

                if (openBraces > closeBraces) {
                    // JSON incompleto - tentar completar
                    const missingBraces = openBraces - closeBraces;
                    jsonText = jsonText + '\n' + '}'.repeat(missingBraces);
                    jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                }
            }

            if (jsonMatch) {
                try {
                    let jsonToParse = jsonMatch[0];

                    // Tentar corrigir JSON incompleto
                    const openBraces = (jsonToParse.match(/\{/g) || []).length;
                    const closeBraces = (jsonToParse.match(/\}/g) || []).length;

                    if (openBraces > closeBraces) {
                        // Adicionar chaves faltantes
                        const missing = openBraces - closeBraces;
                        // Tentar fechar arrays primeiro
                        if (jsonToParse.match(/\[/g) && !jsonToParse.match(/\]/g)) {
                            jsonToParse = jsonToParse.replace(/([^\]]+)$/, '$1]');
                        }
                        // Fechar objetos
                        jsonToParse = jsonToParse + '\n' + '}'.repeat(missing);
                    }

                    resultado = JSON.parse(jsonToParse);
                } catch (e: any) {
                    console.error('Erro ao processar JSON extraído:', e.message);
                    console.error('JSON tentado (primeiros 500 chars):', jsonMatch[0].substring(0, 500));

                    // Última tentativa: pedir novamente com prompt mais específico
                    throw new Error(`Erro ao processar JSON: ${parseError.message}. A resposta da IA pode estar incompleta ou mal formatada. Tente novamente ou use o modo JSON manual.`);
                }
            } else {
                console.error('Texto completo recebido da IA:', jsonText);
                throw new Error('Não foi possível extrair JSON válido da resposta da IA. A resposta pode não estar em formato JSON ou está incompleta.');
            }
        }

        // Log para debug (apenas em desenvolvimento)
        if (import.meta.env.DEV) {
            console.log('Resultado processado:', JSON.stringify(resultado, null, 2).substring(0, 1000));
        }

        // Validação e normalização
        if (!resultado) {
            throw new Error('A IA não retornou dados válidos.');
        }

        // Garantir que meta existe
        if (!resultado.meta) {
            resultado.meta = {
                orgao: '',
                cargo: '',
                versao: '1.0'
            };
        }

        // Validar e normalizar disciplinas
        if (!resultado.disciplinas) {
            // Tentar encontrar disciplinas em outros campos possíveis
            if (resultado.disciplina) {
                resultado.disciplinas = Array.isArray(resultado.disciplina) ? resultado.disciplina : [resultado.disciplina];
            } else if (resultado.materias) {
                resultado.disciplinas = Array.isArray(resultado.materias) ? resultado.materias : [resultado.materias];
            } else {
                throw new Error('Não foi possível encontrar disciplinas na resposta. Verifique se o texto do edital contém informações sobre disciplinas e tópicos.');
            }
        }

        if (!Array.isArray(resultado.disciplinas)) {
            resultado.disciplinas = [resultado.disciplinas];
        }

        // Função para formatar texto em Title Case (primeira letra de cada palavra maiúscula)
        const formatarTitleCase = (texto: string): string => {
            if (!texto) return '';
            return texto
                .split(' ')
                .map(palavra => {
                    if (!palavra) return palavra;
                    // Manter siglas em maiúsculas (ex: TCDF, CEBRASPE)
                    if (palavra === palavra.toUpperCase() && palavra.length > 1) {
                        return palavra;
                    }
                    // Primeira letra maiúscula, resto minúscula
                    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
                })
                .join(' ');
        };

        // Filtrar disciplinas vazias e normalizar estrutura
        resultado.disciplinas = resultado.disciplinas
            .filter((d: any) => d && (d.nome || d.name))
            .map((d: any) => {
                const nomeOriginal = d.nome || d.name || '';
                const disciplina = {
                    nome: formatarTitleCase(nomeOriginal),
                    conteudo: d.conteudo || d.content || d.topicos || d.topics || []
                };

                // Normalizar conteúdo se necessário
                if (Array.isArray(disciplina.conteudo)) {
                    disciplina.conteudo = disciplina.conteudo.map((item: any) => {
                        if (typeof item === 'string') {
                            return {
                                titulo: item,
                                tipo: 'topico',
                                filhos: []
                            };
                        }
                        return {
                            indice: item.indice || item.index || '',
                            titulo: item.titulo || item.title || item.nome || item.name || '',
                            tipo: item.tipo || item.type || 'topico',
                            filhos: item.filhos || item.children || item.subtopicos || item.subtopics || []
                        };
                    });
                } else {
                    disciplina.conteudo = [];
                }

                return disciplina;
            });

        if (resultado.disciplinas.length === 0) {
            throw new Error('Nenhuma disciplina válida foi encontrada. Verifique se o texto do edital contém informações sobre disciplinas e tópicos.');
        }

        return resultado;
    } catch (error: any) {
        console.error("Erro ao processar texto do edital:", error);
        if (error.message && error.message.includes('API key')) {
            throw new Error('API Key do Gemini não configurada ou inválida. Configure a variável VITE_GEMINI_API_KEY no arquivo .env');
        }
        if (error.message) {
            throw error;
        }
        throw new Error('Erro ao processar o texto do edital. Verifique se o texto está completo e bem formatado.');
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

export const getSessoes = async (studyPlanId: string, limit?: number): Promise<SessaoEstudo[]> => {
    if (!studyPlanId || studyPlanId.trim() === '') {
        throw new Error('studyPlanId é obrigatório para carregar as sessões de estudo.');
    }

    const userId = await getUserId();

    let query = supabase
        .from('sessoes_estudo')
        .select('*, questoes_certas, questoes_erradas, banca, is_cebraspe')
        .eq('study_plan_id', studyPlanId)
        .eq('user_id', userId)
        .order('data_estudo', { ascending: false });

    // Aplicar limite se fornecido
    if (limit) {
        query = query.limit(limit);
    }

    const { data, error } = await query;
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
    const payload: any = {
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

    // Adicionar campos de questões se existirem
    if (itemData.questoes_certas !== undefined) payload.questoes_certas = itemData.questoes_certas;
    if (itemData.questoes_erradas !== undefined) payload.questoes_erradas = itemData.questoes_erradas;
    if (itemData.banca !== undefined) payload.banca = itemData.banca;
    if (itemData.is_cebraspe !== undefined) payload.is_cebraspe = itemData.is_cebraspe;

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
    if (!studyPlanId || studyPlanId.trim() === '') {
        console.warn('getRedacoes chamado com studyPlanId vazio, retornando array vazio');
        return [];
    }
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
export const deleteRedacao = async (redacaoId: string): Promise<void> => {
    console.log(`[DEBUG] Tentando excluir redação: ${redacaoId}`);
    const { error, count } = await supabase.from('redacoes_corrigidas').delete({ count: 'exact' }).eq('id', redacaoId);

    if (error) {
        console.error("[DEBUG] Erro ao excluir redação:", error);
        throw error;
    }

    console.log(`[DEBUG] Resultado exclusão redação - Count: ${count}`);

    if (count === 0) {
        console.warn("[DEBUG] Nenhuma redação foi excluída. Verifique ID e permissões.");
    }
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
    // O banco pode retornar duration_minutes (snake) ou durationMinutes (camel) dependendo da query/view
    const { study_plan_id, durationMinutes, duration_minutes, isCebraspe, is_cebraspe, ...rest } = dbData;
    return {
        ...rest,
        studyPlanId: study_plan_id,
        duration_minutes: duration_minutes || durationMinutes || 0,
        is_cebraspe: is_cebraspe !== undefined ? is_cebraspe : isCebraspe,
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
    console.log(`[DEBUG] Tentando excluir revisão: ${id}`);
    const { error, count } = await supabase.from('revisoes').delete({ count: 'exact' }).eq('id', id);

    if (error) {
        console.error("[DEBUG] Erro ao excluir revisão:", error);
        throw error;
    }

    console.log(`[DEBUG] Resultado exclusão revisão - Count: ${count}`);

    if (count === 0) {
        console.warn("[DEBUG] Nenhuma revisão foi excluída. Verifique ID e permissões.");
    }
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
    // Validar que topicId não seja vazio para evitar erro de UUID inválido
    if (!topicId || topicId.trim() === '') {
        console.warn('getFlashcards chamado com topicId vazio, retornando array vazio');
        return [];
    }
    const { data, error } = await supabase.from('flashcards').select('*').eq('topico_id', topicId);
    if (error) throw error;
    return (data as any[]).map(mapDbToFlashcard);
};

export const getFlashcardsMetadata = async (topicIds: string[]): Promise<Partial<Flashcard>[]> => {
    if (!topicIds || topicIds.length === 0) return [];

    // Filtrar IDs vazios
    const validIds = topicIds.filter(id => id && id.trim() !== '');
    if (validIds.length === 0) return [];

    const { data, error } = await supabase
        .from('flashcards')
        .select('id, topico_id, due_date, interval, ease_factor, tags')
        .in('topico_id', validIds);

    if (error) throw error;

    return (data as any[]).map(item => ({
        id: item.id,
        topico_id: item.topico_id,
        dueDate: item.due_date,
        interval: item.interval,
        easeFactor: item.ease_factor,
        tags: item.tags,
        // Campos obrigatórios que virão vazios inicialmente
        pergunta: '',
        resposta: '',
        _contentLoaded: false // Flag interna para indicar que precisa carregar conteúdo
    } as unknown as Partial<Flashcard>));
};

export const getFlashcardsContent = async (flashcardIds: string[]): Promise<Flashcard[]> => {
    if (!flashcardIds || flashcardIds.length === 0) return [];

    const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .in('id', flashcardIds);

    if (error) throw error;

    return (data as any[]).map(mapDbToFlashcard);
};
export const createFlashcards = async (topicId: string, { flashcards }: { flashcards: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[] }): Promise<Flashcard[]> => {
    console.log('[createFlashcards] Iniciando criação de flashcards...');
    console.log('[createFlashcards] topicId:', topicId);
    console.log('[createFlashcards] quantidade:', flashcards.length);

    // Validar topicId para evitar erro de UUID inválido
    if (!topicId || topicId.trim() === '') {
        console.error('[createFlashcards] ERRO: topicId vazio!');
        throw new Error('Tópico não selecionado. Por favor, selecione um tópico antes de salvar os flashcards.');
    }

    const userId = await getUserId();
    console.log('[createFlashcards] userId:', userId);

    // Validar userId para evitar erro de UUID inválido
    if (!userId || userId.trim() === '') {
        console.error('[createFlashcards] ERRO: userId vazio!');
        throw new Error('Usuário não identificado. Por favor, faça login novamente.');
    }
    // Flashcards recém-criados devem ter interval = 0 (não estudados ainda)
    // e due_date para o futuro para não aparecerem na revisão diária imediatamente
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // IMPORTANTE: Remover campo 'tags' pois não existe na tabela do banco de dados
    // O campo tags é usado apenas no frontend/aplicação, não no banco
    const flashcardsToInsert = flashcards.map(fc => {
        // Desestruturar para remover tags e outros campos que não existem no DB
        const { tags, _contentLoaded, ...dbFields } = fc as any;
        return {
            ...dbFields,
            topico_id: topicId,
            user_id: userId,
            interval: 0, // 0 indica que o flashcard nunca foi estudado
            ease_factor: 2.5,
            due_date: tomorrow.toISOString(), // Disponível para estudo a partir de amanhã
        };
    });

    console.log('[createFlashcards] Inserindo no banco...', flashcardsToInsert.length, 'flashcards');

    // FIX: Cast data to any to bypass 'never' type issue.
    const { data, error } = await supabase.from('flashcards').insert(flashcardsToInsert as any).select();

    if (error) {
        console.error('[createFlashcards] ERRO do Supabase:', error);
        throw error;
    }

    console.log('[createFlashcards] ✅ Sucesso! Criados:', data?.length, 'flashcards');
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

/**
 * Deleta todos os flashcards de um tópico
 */
export const deleteFlashcardsByTopic = async (topicoId: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('topico_id', topicoId);
    if (error) throw error;
};


// --- Study Session Management (Flashcard Sync) ---

/**
 * Busca uma sessão de estudo ativa para um deck específico
 */
export const getStudySession = async (userId: string, deckId: string) => {
    const { data, error } = await supabase
        .from('flashcard_study_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('deck_id', deckId)
        .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
};

/**
 * Salva ou atualiza uma sessão de estudo (upsert)
 */
export const saveStudySession = async (session: {
    user_id: string;
    deck_id: string;
    current_index: number;
    deck_data: string[];
    answers: Record<string | number, 'errei' | 'dificil' | 'bom' | 'facil'>;
    session_start_time: string;
}) => {
    const { data, error } = await supabase
        .from('flashcard_study_sessions')
        .upsert({
            ...session,
            last_updated: new Date().toISOString()
        } as any, {
            onConflict: 'user_id,deck_id'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Remove uma sessão de estudo
 */
export const deleteStudySession = async (userId: string, deckId: string) => {
    const { error } = await supabase
        .from('flashcard_study_sessions')
        .delete()
        .eq('user_id', userId)
        .eq('deck_id', deckId);

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


export const countFlashcardsCreatedThisMonth = async (userId: string): Promise<number> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    try {
        // Fetch all flashcards created this month
        const { data, error } = await supabase
            .from('flashcards')
            .select('tags')
            .eq('user_id', userId)
            .gte('created_at', startOfMonth.toISOString());

        if (error) {
            console.error('Erro ao contar flashcards:', error);
            return 0;
        }

        if (!data) return 0;

        // Filter in memory to ensure we catch the tag regardless of DB column type nuances
        const aiFlashcards = data.filter((fc: any) => {
            if (!fc.tags) return false;
            if (Array.isArray(fc.tags)) {
                return fc.tags.includes('Gerado por IA');
            }
            // Fallback for string storage (e.g. JSON string or simple text)
            if (typeof fc.tags === 'string') {
                return fc.tags.includes('Gerado por IA');
            }
            return false;
        });

        return aiFlashcards.length;
    } catch (error) {
        console.error('Erro inesperado ao contar flashcards:', error);
        return 0;
    }
};
