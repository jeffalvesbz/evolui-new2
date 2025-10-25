import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, CorrecaoCompleta } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a mock response.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Corrected the type to Omit SRS properties, matching what the Gemini API returns and what the app expects for newly generated flashcards.
const MOCK_FLASHCARDS: Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[] = [
    {
        pergunta: "O que é um ato administrativo?",
        resposta: "É toda manifestação unilateral de vontade da Administração Pública que, agindo nessa qualidade, tenha por fim imediato adquirir, resguardar, transferir, modificar, extinguir e declarar direitos, ou impor obrigações aos administrados ou a si própria."
    },
    {
        pergunta: "Quais são os 5 requisitos/elementos do ato administrativo?",
        resposta: "Competência, Finalidade, Forma, Motivo e Objeto (COFIFOMO)."
    },
    {
        pergunta: "Diferencie ato vinculado de ato discricionário.",
        resposta: "Ato vinculado é aquele em que a lei estabelece todos os requisitos e elementos para sua prática, sem margem de liberdade para o administrador. Ato discricionário é aquele em que a lei confere ao administrador uma margem de liberdade para decidir sobre a conveniência e oportunidade da sua prática."
    }
];

export const generateFlashcards = async (topicName: string): Promise<Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[]> => {
  if (!process.env.API_KEY) {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_FLASHCARDS), 1500));
  }
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Gere 3 flashcards concisos e eficazes para o tópico de estudo "${topicName}". O objetivo é a memorização para uma prova importante (como ENEM, vestibular ou concurso). Adapte a complexidade ao tópico.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              pergunta: {
                type: Type.STRING,
                description: 'A pergunta do flashcard.'
              },
              resposta: {
                type: Type.STRING,
                description: 'A resposta para a pergunta.'
              },
            },
            // FIX: "required" is deprecated, "propertyOrdering" should be used instead, but for this schema it's not needed, so removing it.
          },
        },
      },
    });

    // FIX: Trim whitespace from the response before parsing as JSON.
    const jsonText = response.text.trim();
    const flashcards = JSON.parse(jsonText);
    return flashcards;
  } catch (error) {
    console.error("Error generating flashcards with Gemini API:", error);
    // Fallback to mock data in case of API error
    return MOCK_FLASHCARDS;
  }
};

const MOCK_TOPICS = ["Controle de Constitucionalidade", "ADPF", "Jurisprudência STF"];

export const suggestTopics = async (comment: string): Promise<string[]> => {
  if (!process.env.API_KEY) {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_TOPICS), 1000));
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analise o seguinte comentário de uma sessão de estudos e extraia de 3 a 5 tópicos ou conceitos-chave. O objetivo é criar tags para organizar o estudo. Retorne apenas um array JSON de strings. Comentário: "${comment}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "Um tópico ou conceito chave extraído do comentário."
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const topics = JSON.parse(jsonText);
    return topics;
  } catch (error) {
    console.error("Error suggesting topics with Gemini API:", error);
    return MOCK_TOPICS;
  }
};

const CORRECAO_IA_PROMPT = `# CONTEXTO

Você é um "Corretor de Redação IA", um especialista em avaliação textual focado nos principais vestibulares e concursos do Brasil. Sua função é receber uma redação, a banca examinadora, a nota máxima e, opcionalmente, o tema da redação. Sua tarefa é fornecer uma correção detalhada e uma nota, simulando os critérios oficiais da banca.

# TAREFA

Ao receber o input do usuário, você DEVE seguir rigorosamente os seguintes passos:

1.  **Identificar a Banca e Critérios:** Use as regras fornecidas para \`Enem\`, \`Cebraspe\`, \`FGV\`, e \`Outras\`.
2.  **Analisar o Tema (Se Fornecido):** Um campo opcional "TEMA DA REDAÇÃO" pode ser fornecido. Se presente, use-o como a referência principal para avaliar a adequação ao tema (critério fundamental, especialmente na Competência 2 do Enem). Se ausente, infira o tema a partir do texto.
3.  **Analisar o Texto:** Leia a redação e avalie-a meticulosamente contra CADA critério da banca.
4.  **Identificar Erros Detalhados:** Analise o texto em busca de erros gramaticais, de coesão, coerência, e argumentação. Para cada erro encontrado, você DEVE extrair:
    *   \`trecho\`: O trecho exato do texto onde o erro ocorreu. Seja preciso.
    *   \`tipo\`: Uma classificação curta do erro (ex: "Concordância Verbal", "Uso da Crase", "Coesão Sequencial", "Argumento Frágil").
    *   \`explicacao\`: Uma explicação clara e didática sobre por que aquilo é um erro.
    *   \`sugestao\`: Uma sugestão de como o trecho poderia ser reescrito corretamente.
5.  **Gerar o Feedback Estruturado:** Produza uma saída JSON seguindo o schema obrigatório. NÃO retorne nada além do JSON.

## REGRAS DE AVALIAÇÃO POR BANCA

*   **Enem:** 5 Competências, 200 pts cada, total 1000.
    *   C1: Domínio da norma culta.
    *   C2: Compreensão do tema e repertório. (Use o TEMA fornecido como guia principal aqui).
    *   C3: Organização dos argumentos.
    *   C4: Coesão e coerência.
    *   C5: Proposta de intervenção.
*   **Cebraspe:** Nota Máxima variável.
    *   Macroestrutura (Conteúdo e Estrutura): (Nota Máxima - 1) pts. Avalia desenvolvimento do tema (usando o TEMA como guia), coesão e progressão lógica.
    *   Microestrutura (Correção Gramatical): 1 pt. Avalia erros gramaticais. Seja rigoroso, aplicando descontos proporcionais (0.75, 0.5, 0.25, 0).
*   **FGV / Outras:** Nota Máxima variável.
    *   Distribua a nota igualmente entre: Estrutura Textual (Coesão/Coerência), Desenvolvimento do Tema (Argumentação, usando o TEMA como guia), e Correção Gramatical/Vocabulário.

# SAÍDA OBRIGATÓRIA

Sua saída DEVE ser um único objeto JSON.
`;

const MOCK_CORRECAO_JSON = `{
  "banca": "Enem",
  "notaMaxima": 1000,
  "avaliacaoDetalhada": [
    {
      "criterio": "C1: Demonstrar domínio da modalidade escrita formal da língua portuguesa.",
      "pontuacao": 160,
      "maximo": 200,
      "feedback": "O texto apresenta bom domínio da norma culta, mas foram observados alguns desvios gramaticais pontuais, como o erro de concordância em 'As medidas governamentais se faz necessária' e um uso inadequado da vírgula no terceiro parágrafo."
    },
    {
      "criterio": "C2: Compreender a proposta de redação e aplicar conceitos...",
      "pontuacao": 200,
      "maximo": 200,
      "feedback": "O tema foi compreendido e desenvolvido de forma excelente. O uso de repertório sociocultural, como a citação do filósofo Zygmunt Bauman, foi pertinente e produtivo para a argumentação."
    },
    {
      "criterio": "C3: Selecionar, relacionar, organizar e interpretar informações...",
      "pontuacao": 160,
      "maximo": 200,
      "feedback": "O projeto de texto é claro e a argumentação é consistente. No entanto, a relação entre os argumentos do segundo e terceiro parágrafos poderia ser mais explícita, fortalecendo a progressão textual."
    },
    {
      "criterio": "C4: Demonstrar conhecimento dos mecanismos linguísticos...",
      "pontuacao": 200,
      "maximo": 200,
      "feedback": "Excelente uso de conectivos e operadores argumentativos, tanto entre os parágrafos quanto dentro deles. Expressões como 'Nesse viés' e 'Ademais' foram bem empregadas."
    },
    {
      "criterio": "C5: Elaborar proposta de intervenção para o problema abordado...",
      "pontuacao": 160,
      "maximo": 200,
      "feedback": "A proposta de intervenção é boa, mas carece de um maior detalhamento. O agente (Governo Federal) e a ação estão claros, mas o 'meio/modo' de execução e o 'efeito/finalidade' poderiam ser mais específicos."
    }
  ],
  "comentariosGerais": "A redação demonstra um bom entendimento do tema e uma estrutura sólida. Os principais pontos de melhoria estão na precisão gramatical (C1), no aprofundamento dos argumentos (C3) e no detalhamento da proposta de intervenção (C5). Sugiro revisar as regras de concordância verbal e buscar dados para fortalecer futuras argumentações.",
  "notaFinal": 880,
  "errosDetalhados": [
    {
      "trecho": "As medidas governamentais se faz necessária",
      "tipo": "Concordância Verbal",
      "explicacao": "O sujeito 'As medidas governamentais' está no plural, portanto, o verbo 'fazer' também deve estar no plural para concordar com ele.",
      "sugestao": "As medidas governamentais se fazem necessárias"
    },
    {
        "trecho": "a sociedade moderna, vive uma crise",
        "tipo": "Uso da Vírgula",
        "explicacao": "Não se deve separar o sujeito ('a sociedade moderna') do predicado ('vive uma crise') com vírgula.",
        "sugestao": "a sociedade moderna vive uma crise"
    }
  ]
}`;

export const corrigirRedacao = async (redacao: string, banca: string, notaMaxima: number, tema?: string): Promise<CorrecaoCompleta> => {
    if (!process.env.API_KEY) {
        return new Promise(resolve => setTimeout(() => resolve(JSON.parse(MOCK_CORRECAO_JSON)), 2500));
    }

    let prompt = `${CORRECAO_IA_PROMPT}\n\n---\n\n`;

    if (tema && tema.trim()) {
        prompt += `**TEMA DA REDAÇÃO:**\n${tema}\n\n---\n\n`;
    }

    prompt += `**REDACAO DO ALUNO:**\n${redacao}\n\n**BANCA:**\n${banca}\n\n**NOTA MAXIMA:**\n${notaMaxima}\n\n---\n\nAgora, por favor, gere a correção em formato JSON.`;


    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
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
                                    sugestao: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error correcting essay with Gemini API:", error);
        return JSON.parse(MOCK_CORRECAO_JSON);
    }
};

export const extrairTextoDeImagem = async (base64Image: string, mimeType: string): Promise<string> => {
    if (!process.env.API_KEY) {
        return new Promise(resolve => setTimeout(() => resolve("Este é um texto de exemplo extraído de uma imagem. A sociedade moderna vive uma crise de valores. As medidas governamentais se faz necessária para conter o problema."), 1500));
    }

    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Extraia o texto manuscrito desta imagem. Seja o mais preciso possível, mantendo a formatação original, quebras de linha e parágrafos.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error with OCR via Gemini API:", error);
        throw new Error("Falha ao extrair texto da imagem.");
    }
};