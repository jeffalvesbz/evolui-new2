// This file defines the types for the application.

export interface StudyPlan {
  id: string;
  nome: string;
  descricao: string;
  data_alvo: string;
  banca?: string;
  orgao?: string;
}

<<<<<<< HEAD
=======
export type NivelDificuldade = 'fácil' | 'médio' | 'difícil' | 'desconhecido';

>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
export interface Topico {
  id: string;
  titulo: string;
  concluido: boolean;
  nivelDificuldade: NivelDificuldade;
  ultimaRevisao: string | null;
  proximaRevisao: string | null;
}

export interface Disciplina {
  id: string;
  nome: string;
  progresso: number;
  anotacoes: string;
  topicos: Topico[];
  studyPlanId: string;
}

export interface SessaoEstudo {
  id: string;
  topico_id: string;
  tempo_estudado: number; // in seconds
  data_estudo: string;
  comentarios?: string;
  studyPlanId: string;
<<<<<<< HEAD
  questoes_certas?: number;
  questoes_erradas?: number;
  banca?: string;
  is_cebraspe?: boolean;
  created_at?: string;
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
}

export interface SessaoCiclo {
  id: string;
  ordem: number;
  disciplina_id: string;
  tempo_previsto: number; // in seconds
}

export interface Ciclo {
  id: string;
  nome: string;
  sessoes: SessaoCiclo[];
  studyPlanId: string;
}

export interface Revisao {
  id: string;
  topico_id: string;
  disciplinaId: string;
  conteudo: string;
  data_prevista: string;
<<<<<<< HEAD
  status: RevisaoStatus;
  origem: OrigemRevisao;
=======
  status: 'pendente' | 'concluida' | 'atrasada';
  origem: 'flashcard' | 'erro' | 'manual' | 'teorica';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  dificuldade: NivelDificuldade;
  studyPlanId: string;
}

<<<<<<< HEAD
// Tipos para enums do banco de dados
export type EstiloFlashcard = 'direto' | 'explicativo' | 'completar';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type GrupoTipo = 'clube' | 'estudo' | 'competicao';
export type TipoAcessoGrupo = 'aberto' | 'fechado' | 'privado';
export type RevisaoStatus = 'pendente' | 'concluida' | 'atrasada';
export type NivelDificuldade = 'fácil' | 'médio' | 'difícil' | 'desconhecido';
export type OrigemRevisao = 'flashcard' | 'erro' | 'manual' | 'teorica';
export type PeriodoRanking = 'diario' | 'semanal' | 'mensal';

=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
export interface Flashcard {
  id: string;
  topico_id: string;
  pergunta: string;
  resposta: string;
  // SRS Properties
  interval: number; // in days
  easeFactor: number; // multiplier
  dueDate: string; // ISO string date
<<<<<<< HEAD
  estilo?: EstiloFlashcard;
  tags?: string[]; // Tags para categorização e busca
  _contentLoaded?: boolean; // Flag para indicar se o conteúdo completo foi carregado
}

// Tipos para sincronização de sessões de estudo
export interface FlashcardStudySession {
  id: string;
  user_id: string;
  deck_id: string;
  current_index: number;
  deck_data: string[]; // Array de flashcard IDs
  answers: Record<number, 'errei' | 'dificil' | 'bom' | 'facil'>;
  session_start_time: string;
  last_updated: string;
}

// Tipo para histórico de revisões
export interface FlashcardReview {
  id: string;
  user_id: string;
  flashcard_id: string;
  quality: 0 | 1 | 2 | 3 | 4 | 5;
  response_time_ms?: number;
  reviewed_at: string;
}

// Tipo para estatísticas de flashcards
export interface FlashcardStats {
  cardsStudiedToday: number;
  cardsStudiedThisWeek: number;
  totalReviews: number;
  accuracyRate: number; // 0-100
  currentStreak: number;
  bestStreak: number;
  reviewsByDay: { date: string; count: number }[]; // Para heatmap
  accuracyByDisciplina: { disciplinaId: string; nome: string; accuracy: number }[];
}

// Tipos para Modo Quiz
export interface QuizQuestion {
  flashcard: Flashcard;
  options: string[]; // 4 opções (1 correta + 3 distrações)
  correctAnswer: string;
  explanation?: string; // Explicação do porquê a resposta está correta
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: Record<number, { selected: string; correct: boolean; timeSpent: number }>;
  startTime: number;
  questionStartTime: number; // Tempo de início da questão atual
  timerEnabled: boolean;
  timeLimit?: number; // em segundos por pergunta
  completed?: boolean;
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  totalTime: number;
  averageTimePerQuestion: number;
}

export interface Quiz {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  mode: 'standard' | 'true_false';
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
  studyPlanId?: string;
}




=======
  estilo?: 'direto' | 'explicativo' | 'completar';
}

>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
export interface RevisaoErro {
  data: string;
  status: 'pendente' | 'revisado';
}

export interface CadernoErro {
  id: string;
  disciplina: string;
  disciplinaId: string;
  assunto: string;
  descricao: string;
  topicoId?: string; // Tópico do edital
  topicoTitulo?: string;
  resolvido: boolean;
  data: string; // ISO string date
  proximaRevisao?: string; // ISO string date
  nivelDificuldade?: 'fácil' | 'médio' | 'difícil';
  revisoes?: RevisaoErro[];
  observacoes?: string;
  studyPlanId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface DashboardStats {
  dailyGoalHours: number;
  weeklyGoalHours: number;
  streakDays: number;
  revisionsCount: number;
  errorsResolvedCount: number;
  activeEdital: string;
  studiesCompleted: number;
  activeDisciplines: number;
  totalTimeToday: string;
}

export type Theme = 'light' | 'dark';

// Tipos para o Corretor de Redação IA
export interface CorrecaoErroDetalhado {
  trecho: string;
  tipo: string;
  explicacao: string;
  sugestao: string;
}

export interface CorrecaoCriterio {
  criterio: string;
  pontuacao: number;
  maximo: number;
  peso: number;
  feedback: string;
}

export interface CorrecaoCompleta {
  banca: string;
  notaMaxima: number;
  avaliacaoGeral: string;
  avaliacaoDetalhada: CorrecaoCriterio[];
  comentariosGerais: string;
  notaFinal: number;
  errosDetalhados: CorrecaoErroDetalhado[];
  textoCorrigido?: string;
  sinteseFinal: string;
}

// Entrada para correção (pesos e notas definidos pelo usuário)
export interface NotasPesosEntrada {
  conteudo?: { nota: number; peso: number; maximo: number };
  estrutura?: { nota: number; peso: number; maximo: number };
  linguagem?: { nota: number; peso: number; maximo: number };
  argumentacao?: { nota: number; peso: number; maximo: number };
  coesao?: { nota: number; peso: number; maximo: number };
  observacaoAvaliador?: string;
}

export interface RedacaoCorrigida {
  id: string;
  texto: string;
  banca: string;
  notaMaxima: number;
  correcao: CorrecaoCompleta;
  data: string; // ISO string
  tema?: string;
  studyPlanId: string;
}

// Tipos para o Gerador de Plano IA
export interface DisciplinaParaIA {
  id: string;
  nome: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  topicos: { id: string; titulo: string }[];
}

<<<<<<< HEAD
// Tipos para o sistema de Amigos (usando o tipo definido acima)
export interface Friendship {
  id: string;
  user_id_1: string; // requester
  user_id_2: string; // receiver
  status: FriendshipStatus;
  created_at: string;
}

export interface FriendRequest {
  friendship_id: string;
  requester_id: string;
  requester_name: string;
}

export interface Simulation {
  id: string;
  name: string;
  correct: number;
  wrong: number;
  blank?: number;
  duration_minutes: number; // Campo do banco em snake_case
  notes?: string;
  date: string; // ISO string
  studyPlanId: string; // Campo mapeado do banco
  is_cebraspe?: boolean; // Campo do banco em snake_case
}

=======
// Tipos para Gamificação
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Should match an icon component name
  xp: number;
  is_secret?: boolean;
}

export interface GamificationStats {
  user_id: string;
  xp_total: number;
  level: number;
  current_streak_days: number;
  best_streak_days: number;
  unlockedBadgeIds: string[];
}

export type XpLogEvent = 
  'cronometro_finalizado' |
  'estudo_manual' |
  'revisao_concluida' | 
  'revisao_atrasada' |
  'revisao_dificil' |
  'trilha_topico_concluido' | 
  'estudo_extra' |
  'meta_semanal_completa' |
  'missao_diaria_completa' |
  'conquista_desbloqueada';

export interface XpLogEntry {
  id: string;
  user_id: string;
  event: XpLogEvent;
  amount: number;
  meta_json: Record<string, any>;
  created_at: string;
  tipo_evento?: 'ativo' | 'manual';
  multiplicador?: number;
}

// Tipos para o sistema de Amigos
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface Friendship {
    id: string;
    user_id_1: string; // requester
    user_id_2: string; // receiver
    status: FriendshipStatus;
    created_at: string;
}

export interface FriendRequest {
    friendship_id: string;
    requester_id: string;
    requester_name: string;
    requester_level: number;
}
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
