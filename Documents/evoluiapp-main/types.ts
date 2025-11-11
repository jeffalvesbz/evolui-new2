// This file defines the types for the application.

export interface StudyPlan {
  id: string;
  nome: string;
  descricao: string;
  data_alvo: string;
  banca?: string;
  orgao?: string;
}

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
  status: RevisaoStatus;
  origem: OrigemRevisao;
  dificuldade: NivelDificuldade;
  studyPlanId: string;
}

// Tipos para enums do banco de dados
export type EstiloFlashcard = 'direto' | 'explicativo' | 'completar';
export type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'blocked';
export type GrupoTipo = 'clube' | 'estudo' | 'competicao';
export type TipoAcessoGrupo = 'aberto' | 'fechado' | 'privado';
export type RevisaoStatus = 'pendente' | 'concluida' | 'atrasada';
export type NivelDificuldade = 'fácil' | 'médio' | 'difícil' | 'desconhecido';
export type OrigemRevisao = 'flashcard' | 'erro' | 'manual' | 'teorica';
export type PeriodoRanking = 'diario' | 'semanal' | 'mensal';

export interface Flashcard {
  id: string;
  topico_id: string;
  pergunta: string;
  resposta: string;
  // SRS Properties
  interval: number; // in days
  easeFactor: number; // multiplier
  dueDate: string; // ISO string date
  estilo?: EstiloFlashcard;
}

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

