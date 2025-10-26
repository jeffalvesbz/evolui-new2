import { Flashcard, CorrecaoCompleta, RedacaoCorrigida } from '../types';

// --- MOCK DATABASE ---
const DB_KEY = 'evolui_mock_db';
let db: any = {
    editais: [],
    disciplinas: [],
    sessoes: [],
    revisoes: [],
    erros: [],
    ciclos: [],
    flashcards: [],
    redacoes: [],
    simulados: [],
};
const uuid = () => crypto.randomUUID();

try {
    const storedDb = localStorage.getItem(DB_KEY);
    if (storedDb) {
        db = JSON.parse(storedDb);
    } else {
        const editalId = uuid();
        db.editais.push({
            id: editalId,
            nome: 'Edital de Exemplo',
            descricao: 'Um plano de estudos para começar sua jornada.',
            data_alvo: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
        });
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    }
} catch (e) {
    console.error("Could not load or initialize mock DB", e);
}

const persist = () => {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch(e) {
        console.error("Could not persist mock DB", e);
    }
};

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  await new Promise(res => setTimeout(res, Math.random() * 300 + 50)); // Simulate network delay

  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  console.log(`[MOCK API] ${method} ${endpoint}`, body);

  // --- AUTH ---
  if (endpoint.startsWith('/auth/login')) {
      if (body.email === 'test@evolui.app' && body.password === 'password') {
          return { token: 'fake-jwt-token-for-testing', user: { id: 'user-1', name: 'Jefferson Alves', email: 'test@evolui.app' } };
      }
      throw new Error('Credenciais inválidas');
  }

  // --- AI PROXIES ---
  if (endpoint.startsWith('/ai/')) {
    if (endpoint === '/ai/generate-flashcards') {
        return [{ pergunta: `O que é ${body.topicName}?`, resposta: 'É um conceito fundamental para o estudo.' }, { pergunta: 'Qual a principal característica?', resposta: 'Sua principal característica é a complexidade.' }, { pergunta: 'Onde se aplica?', resposta: 'Aplica-se em diversos contextos práticos.' }];
    }
    if (endpoint === '/ai/suggest-topics') {
        return ['Tópico Sugerido 1', 'Tópico Sugerido 2', 'Tópico Sugerido 3'];
    }
    if (endpoint === '/ai/extrair-texto-de-imagem') {
        return { text: 'Este é um texto extraído da imagem com sucesso pela IA.' };
    }
    if (endpoint === '/ai/corrigir-redacao') {
        return {
            banca: body.banca,
            notaMaxima: body.notaMaxima,
            avaliacaoDetalhada: [
                { criterio: 'Critério 1: Estrutura', pontuacao: Math.round(body.notaMaxima * 0.8), maximo: body.notaMaxima, feedback: 'Boa estrutura, mas a introdução pode ser mais clara.' },
                { criterio: 'Critério 2: Argumentação', pontuacao: Math.round(body.notaMaxima * 0.7), maximo: body.notaMaxima, feedback: 'Argumentos sólidos, mas falta aprofundamento.' }
            ],
            comentariosGerais: 'A redação demonstra bom conhecimento do tema. Melhore a coesão entre os parágrafos.',
            notaFinal: (body.notaMaxima / 2) * 1.5,
            errosDetalhados: [
                { trecho: 'houveram muitos', tipo: 'Concordância', explicacao: 'O verbo "haver" no sentido de "existir" é impessoal.', sugestao: 'houve muitos' }
            ]
        } as CorrecaoCompleta;
    }
    return {};
  }

  // --- DATA CRUD ---
  // Simple router
  const [_, resource, id, subresource] = endpoint.split('/');

  // GET
  if (method === 'GET') {
      if (resource === 'editais' && id && subresource) return db[subresource].filter((item: any) => item.studyPlanId === id || item.edital_id === id);
      if (resource === 'editais') return db.editais;
      if (resource === 'topicos' && id && subresource === 'flashcards') return db.flashcards.filter((f: any) => f.topico_id === id);
  }
  
  // POST
  if (method === 'POST') {
    let newItem;
    if (resource === 'editais' && id && subresource) {
        newItem = { ...body, id: uuid(), studyPlanId: id, edital_id: id };
        if(subresource === 'disciplinas') newItem.topicos = (newItem.topicos || []).map((t: any) => ({ ...t, id: uuid() }));
        if(subresource === 'ciclos') newItem.sessoes = (newItem.sessoes || []).map((s: any) => ({ ...s, id: uuid() }));
        if(subresource === 'redacoes') newItem.data = new Date().toISOString();
        db[subresource].push(newItem);
    } else if (resource === 'editais') {
        newItem = { ...body, id: uuid() };
        db.editais.push(newItem);
    } else if (resource === 'disciplinas' && id && subresource === 'topicos') {
        newItem = { ...body, id: uuid() };
        const disciplina = db.disciplinas.find((d: any) => d.id === id);
        if (disciplina) disciplina.topicos.push(newItem);
    } else if (resource === 'topicos' && id && subresource === 'flashcards') {
        const newFlashcards = body.flashcards.map((fc: any) => ({ ...fc, id: uuid(), topico_id: id, interval: 1, easeFactor: 2.5, dueDate: new Date().toISOString()}));
        db.flashcards.push(...newFlashcards);
        persist();
        return newFlashcards;
    }
    persist();
    return newItem;
  }
  
  // PUT
  if (method === 'PUT') {
    let updatedItem;
    const collection = db[resource];
    if(collection && id) {
        db[resource] = collection.map((item: any) => item.id === id ? (updatedItem = { ...item, ...body }) : item);
    } else if (resource === 'topicos' && id) {
         db.disciplinas.forEach((d: any) => {
            d.topicos = d.topicos.map((t: any) => t.id === id ? (updatedItem = { ...t, ...body }) : t);
        });
    }
    persist();
    return updatedItem;
  }
  
  // DELETE
  if (method === 'DELETE') {
    if (resource === 'editais' && id) {
        db.editais = db.editais.filter((e: any) => e.id !== id);
        // Cascade delete
        db.disciplinas = db.disciplinas.filter((d: any) => d.studyPlanId !== id);
        db.sessoes = db.sessoes.filter((s: any) => s.studyPlanId !== id);
        db.revisoes = db.revisoes.filter((r: any) => r.studyPlanId !== id);
        db.erros = db.erros.filter((e: any) => e.studyPlanId !== id);
        db.ciclos = db.ciclos.filter((c: any) => c.studyPlanId !== id);
        db.redacoes = db.redacoes.filter((r: any) => r.studyPlanId !== id);
        db.simulados = db.simulados.filter((s: any) => s.edital_id !== id);
    } else {
        const collection = db[resource];
        if (collection && id) {
            db[resource] = collection.filter((item: any) => item.id !== id);
        }
    }
    persist();
    return null;
  }

  console.error(`[MOCK API] Unhandled route: ${method} ${endpoint}`);
  return null;
};

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

// --- DATA SERVICES ---
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
