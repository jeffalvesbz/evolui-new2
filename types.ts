// FIX: Removed the conflicting import statement. This file defines the types it was trying to import.

export interface StudyPlan {
  id: string;
  nome: string;
  descricao: string;
  data_alvo: string;
}

export type NivelDificuldade = 'fácil' | 'médio' | 'difícil' | 'desconhecido';

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
}

export interface SessaoEstudo {
  id: string;
  topico_id: string;
  tempo_estudado: number; // in seconds
  data_estudo: string;
  comentarios?: string;
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
}

export interface Revisao {
  id: string;
  topico_id: string;
  disciplinaId: string;
  conteudo: string;
  data_prevista: string;
  status: 'pendente' | 'concluida' | 'atrasada';
  origem: 'flashcard' | 'erro' | 'manual' | 'teorica';
  dificuldade: NivelDificuldade;
}

export interface Flashcard {
  id: string;
  topico_id: string;
  pergunta: string;
  resposta: string;
  // SRS Properties
  interval: number; // in days
  easeFactor: number; // multiplier
  dueDate: string; // ISO string date
}

export interface RevisaoErro {
  data: string;
  status: 'pendente' | 'revisado';
}

export interface CadernoErro {
  id: string;
  disciplina: string;
  // FIX: Added disciplinaId to link errors to a specific discipline, resolving form and data model inconsistencies.
  disciplinaId?: string;
  assunto: string;
  descricao: string;
  topicoId?: string; // Tópico do edital
  topicoTitulo?: string;
  resolvido: boolean;
  data: string; // ISO string date
  proximaRevisao?: string; // ISO string date
  nivelDificuldade?: 'fácil' | 'médio' | 'difícil';
  revisoes?: RevisaoErro[];
  enunciado?: string;
  alternativaCorreta?: string;
  observacoes?: string;
}

export interface User {
  id: string;
  name: string;
  avatarLetter: string;
  status: string;
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
  feedback: string;
}

export interface CorrecaoCompleta {
  banca: string;
  notaMaxima: number;
  avaliacaoDetalhada: CorrecaoCriterio[];
  comentariosGerais: string;
  notaFinal: number;
  errosDetalhados: CorrecaoErroDetalhado[];
}

export interface RedacaoCorrigida {
  id: string;
  texto: string;
  banca: string;
  notaMaxima: number;
  correcao: CorrecaoCompleta;
  data: string; // ISO string
  tema?: string;
}
