import { z } from 'zod';

/**
 * Schema de validação para criação de sessão de estudo
 */
export const createSessionSchema = z.object({
  disciplinaId: z
    .string()
    .uuid('ID de disciplina inválido'),
  topicoId: z
    .string()
    .uuid('ID de tópico inválido')
    .optional(),
  duracaoMinutos: z
    .number()
    .min(1, 'Duração deve ser no mínimo 1 minuto')
    .max(480, 'Duração não pode exceder 8 horas'),
  anotacoes: z
    .string()
    .max(5000, 'Anotações muito longas')
    .optional(),
  data: z
    .string()
    .datetime('Data inválida')
    .optional(),
});

/**
 * Schema de validação para criação de ciclo de estudos
 */
export const createCicloSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome muito longo'),
  disciplinas: z
    .array(z.string().uuid('ID de disciplina inválido'))
    .min(1, 'Selecione pelo menos uma disciplina'),
  duracaoMinutos: z
    .number()
    .min(5, 'Duração deve ser no mínimo 5 minutos')
    .max(480, 'Duração não pode exceder 8 horas'),
});

/**
 * Schema de validação para criação de flashcard
 */
export const createFlashcardSchema = z.object({
  pergunta: z
    .string()
    .min(1, 'Pergunta é obrigatória')
    .max(1000, 'Pergunta muito longa'),
  resposta: z
    .string()
    .min(1, 'Resposta é obrigatória')
    .max(2000, 'Resposta muito longa'),
  topicoId: z
    .string()
    .uuid('ID de tópico inválido'),
  dificuldade: z
    .enum(['facil', 'medio', 'dificil'], {
      errorMap: () => ({ message: 'Dificuldade inválida' }),
    })
    .optional(),
});

/**
 * Schema de validação para correção de redação
 */
export const redacaoSchema = z.object({
  texto: z
    .string()
    .min(50, 'A redação deve ter no mínimo 50 caracteres')
    .max(10000, 'A redação não pode exceder 10.000 caracteres'),
  banca: z
    .string()
    .min(1, 'Selecione uma banca'),
  notaMaxima: z
    .number()
    .min(0, 'Nota máxima inválida')
    .max(1000, 'Nota máxima muito alta'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CreateCicloInput = z.infer<typeof createCicloSchema>;
export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type RedacaoInput = z.infer<typeof redacaoSchema>;




