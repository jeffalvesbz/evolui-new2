import { StudyPlan, Disciplina, SessaoEstudo, Revisao, CadernoErro, Ciclo, User, DashboardStats } from '../types';

// --- Editais ---
export const mockStudyPlanPLF: StudyPlan = {
  id: 'plan-plf-2025',
  nome: 'PLF (Câmara dos Deputados)',
  descricao: 'Foco total para o concurso da Câmara dos Deputados, cargo de Policial Legislativo Federal.',
  data_alvo: '2026-03-19',
};

export const mockStudyPlanENEM: StudyPlan = {
  id: 'plan-enem-2024',
  nome: 'ENEM 2024',
  descricao: 'Plano de estudos focado nas cinco áreas de conhecimento do Exame Nacional do Ensino Médio.',
  data_alvo: '2024-11-03',
};


// --- User & Dashboard (geral) ---
export const mockUser: User = {
  id: 'user-jefferson-1',
  name: 'Jefferson Alves Bezerra',
  avatarLetter: 'J',
  status: 'Acesso autenticado',
};

export const mockDashboardStats: DashboardStats = {
  dailyGoalHours: 6,
  weeklyGoalHours: 42,
  streakDays: 0,
  revisionsCount: 0,
  errorsResolvedCount: 0,
  activeEdital: 'PLF',
  studiesCompleted: 0,
  activeDisciplines: 3,
  totalTimeToday: '9h 8min',
};

// --- Disciplinas por Edital ---
export const initialDisciplinasPLF: Disciplina[] = [
  {
    id: 'plf-disc-01',
    nome: 'Direito Constitucional',
    progresso: 33,
    anotacoes: 'Focar em controle de constitucionalidade e direitos fundamentais. A banca examinadora costuma cobrar jurisprudência recente do STF sobre esses temas.',
    topicos: [
      { id: 'plf-top-01', titulo: 'Controle de Constitucionalidade', concluido: false, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
      { id: 'plf-top-02', titulo: 'Direitos e Garantias Fundamentais', concluido: true, nivelDificuldade: 'médio', ultimaRevisao: '2024-07-20', proximaRevisao: '2024-07-27' },
      { id: 'plf-top-03', titulo: 'Organização do Estado', concluido: false, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
    ],
  },
  {
    id: 'plf-disc-02',
    nome: 'Direito Administrativo',
    progresso: 50,
    anotacoes: 'A nova lei de licitações (14.133) é o ponto principal. Atos administrativos também é um tópico de alta incidência.',
    topicos: [
      { id: 'plf-top-04', titulo: 'Atos Administrativos', concluido: true, nivelDificuldade: 'médio', ultimaRevisao: '2024-07-21', proximaRevisao: '2024-07-28' },
      { id: 'plf-top-05', titulo: 'Licitações e Contratos (Lei 14.133)', concluido: false, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
      { id: 'plf-top-06', titulo: 'Agentes Públicos', concluido: true, nivelDificuldade: 'fácil', ultimaRevisao: '2024-07-18', proximaRevisao: '2024-07-25' },
    ],
  },
  {
    id: 'plf-disc-03',
    nome: 'Língua Portuguesa',
    progresso: 67,
    anotacoes: 'Praticar mais questões de concordância e crase. Interpretação de textos é o diferencial.',
    topicos: [
      { id: 'plf-top-07', titulo: 'Concordância Verbal e Nominal', concluido: true, nivelDificuldade: 'médio', ultimaRevisao: '2024-07-22', proximaRevisao: '2024-07-29' },
      { id: 'plf-top-08', titulo: 'Crase', concluido: true, nivelDificuldade: 'fácil', ultimaRevisao: '2024-07-23', proximaRevisao: '2024-07-30' },
      { id: 'plf-top-09', titulo: 'Interpretação de Textos', concluido: false, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
    ],
  },
];

export const initialDisciplinasENEM: Disciplina[] = [
  {
    id: 'enem-disc-01',
    nome: 'Matemática e suas Tecnologias',
    progresso: 25,
    anotacoes: 'Revisar geometria plana e análise combinatória. Focar em problemas do dia a dia.',
    topicos: [
      { id: 'enem-top-01', titulo: 'Funções de 1º e 2º Grau', concluido: true, nivelDificuldade: 'fácil', ultimaRevisao: null, proximaRevisao: null },
      { id: 'enem-top-02', titulo: 'Análise Combinatória', concluido: false, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
      { id: 'enem-top-03', titulo: 'Probabilidade', concluido: false, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
      { id: 'enem-top-04', titulo: 'Geometria Espacial', concluido: false, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
    ],
  },
  {
    id: 'enem-disc-02',
    nome: 'Ciências da Natureza e suas Tecnologias',
    progresso: 50,
    anotacoes: 'Foco em ecologia (Biologia), estequiometria (Química) e cinemática (Física).',
    topicos: [
      { id: 'enem-top-05', titulo: 'Ecologia e Sustentabilidade', concluido: true, nivelDificuldade: 'fácil', ultimaRevisao: null, proximaRevisao: null },
      { id: 'enem-top-06', titulo: 'Cálculos Estequiométricos', concluido: true, nivelDificuldade: 'difícil', ultimaRevisao: null, proximaRevisao: null },
      { id: 'enem-top-07', titulo: 'Leis de Newton', concluido: false, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
      { id: 'enem-top-08', titulo: 'Genética Mendeliana', concluido: false, nivelDificuldade: 'médio', ultimaRevisao: null, proximaRevisao: null },
    ],
  },
];

export const mockDisciplinasPorEdital: Record<string, Disciplina[]> = {
  [mockStudyPlanPLF.id]: initialDisciplinasPLF,
  [mockStudyPlanENEM.id]: initialDisciplinasENEM,
};

// --- Sessões de Estudo por Edital ---
export const mockSessoesPLF: SessaoEstudo[] = [
    { id: 'ses-01', topico_id: 'plf-top-02', tempo_estudado: 3600, data_estudo: '2024-07-20' },
    { id: 'ses-02', topico_id: 'plf-top-04', tempo_estudado: 2700, data_estudo: '2024-07-21' },
];

export const mockSessoesENEM: SessaoEstudo[] = [
    { id: 'ses-03', topico_id: 'enem-top-01', tempo_estudado: 3200, data_estudo: '2024-07-22' },
    { id: 'ses-04', topico_id: 'enem-top-05', tempo_estudado: 1800, data_estudo: '2024-07-23' },
];

export const mockSessoesPorEdital: Record<string, SessaoEstudo[]> = {
  [mockStudyPlanPLF.id]: mockSessoesPLF,
  [mockStudyPlanENEM.id]: mockSessoesENEM,
};


// --- Revisões por Edital ---
const today = new Date();
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date(today); twoDaysAgo.setDate(today.getDate() - 2);
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);

export const mockRevisoesPLF: Revisao[] = [
    { id: 'rev-01', topico_id: 'plf-top-02', disciplinaId: 'plf-disc-01', conteudo: 'Revisar os 5 requisitos do ato administrativo.', data_prevista: today.toISOString(), status: 'pendente', origem: 'teorica', dificuldade: 'médio' },
    { id: 'rev-02', topico_id: 'plf-top-04', disciplinaId: 'plf-disc-02', conteudo: 'Quais são os atributos do ato administrativo?', data_prevista: today.toISOString(), status: 'pendente', origem: 'flashcard', dificuldade: 'fácil' },
    { id: 'rev-03', topico_id: 'plf-top-07', disciplinaId: 'plf-disc-03', conteudo: 'Resolver 10 questões de concordância verbal.', data_prevista: twoDaysAgo.toISOString(), status: 'atrasada', origem: 'manual', dificuldade: 'médio' },
    { id: 'rev-04', topico_id: 'plf-top-06', disciplinaId: 'plf-disc-02', conteudo: 'Diferença entre cargo, emprego e função pública.', data_prevista: tomorrow.toISOString(), status: 'pendente', origem: 'teorica', dificuldade: 'fácil' },
    { id: 'rev-05', topico_id: 'plf-top-01', disciplinaId: 'plf-disc-01', conteudo: 'Quando a ADPF é cabível?', data_prevista: nextWeek.toISOString(), status: 'pendente', origem: 'erro', dificuldade: 'difícil' },
    { id: 'rev-06', topico_id: 'plf-top-08', disciplinaId: 'plf-disc-03', conteudo: 'Casos de crase facultativa.', data_prevista: yesterday.toISOString(), status: 'concluida', origem: 'flashcard', dificuldade: 'fácil' },
];

export const mockRevisoesENEM: Revisao[] = [
    { id: 'rev-07', topico_id: 'enem-top-02', disciplinaId: 'enem-disc-01', conteudo: 'Revisar princípio fundamental da contagem.', data_prevista: today.toISOString(), status: 'pendente', origem: 'teorica', dificuldade: 'difícil' },
    { id: 'rev-08', topico_id: 'enem-top-06', disciplinaId: 'enem-disc-02', conteudo: 'Balanceamento de equações químicas.', data_prevista: tomorrow.toISOString(), status: 'pendente', origem: 'manual', dificuldade: 'médio' },
    { id: 'rev-09', topico_id: 'enem-top-05', disciplinaId: 'enem-disc-02', conteudo: 'Ciclos biogeoquímicos: Carbono e Nitrogênio.', data_prevista: yesterday.toISOString(), status: 'concluida', origem: 'flashcard', dificuldade: 'fácil' },
];

export const mockRevisoesPorEdital: Record<string, Revisao[]> = {
  [mockStudyPlanPLF.id]: mockRevisoesPLF,
  [mockStudyPlanENEM.id]: mockRevisoesENEM,
};


// --- Caderno de Erros por Edital ---
export const mockErrosPorEdital: Record<string, CadernoErro[]> = {
    [mockStudyPlanPLF.id]: [
        { 
            id: 'err-01', 
            topicoId: 'plf-top-01',
            topicoTitulo: 'Controle de Constitucionalidade',
            disciplina: 'Direito Constitucional',
            assunto: 'Controle Difuso',
            descricao: 'Confundi os tipos de controle de constitucionalidade.', 
            observacoes: 'Revisar aula sobre controle preventivo vs. repressivo.',
            data: '2024-07-20T10:00:00Z',
            resolvido: false,
            nivelDificuldade: 'difícil',
            revisoes: [{ data: '2024-07-21T10:00:00Z', status: 'pendente' }],
        },
    ],
    [mockStudyPlanENEM.id]: [
        { 
            id: 'err-02', 
            topicoId: 'enem-top-01', 
            topicoTitulo: 'Funções de 1º e 2º Grau',
            disciplina: 'Matemática e suas Tecnologias',
            assunto: 'Fórmula de Bhaskara',
            descricao: 'Errei a fórmula de Bhaskara em um exercício simples.', 
            observacoes: 'Praticar 10 exercícios de equação de segundo grau.',
            data: '2024-07-22T14:00:00Z',
            resolvido: true,
            nivelDificuldade: 'fácil',
        },
    ]
};


// --- Ciclo de Estudos (Exemplo único) ---
export const mockCiclo: Ciclo = {
  id: 'ciclo-avancado-01',
  nome: 'Ciclo Avançado',
  sessoes: [
    { id: 'cs-av-01', ordem: 1, disciplina_id: 'plf-disc-01', tempo_previsto: 3600 }, // Direito Constitucional, 1h
    { id: 'cs-av-02', ordem: 2, disciplina_id: 'plf-disc-02', tempo_previsto: 2700 }, // Direito Administrativo, 45min
    { id: 'cs-av-03', ordem: 3, disciplina_id: 'plf-disc-03', tempo_previsto: 5400 }, // Língua Portuguesa, 1h30min
  ],
};