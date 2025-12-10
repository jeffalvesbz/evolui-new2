-- Migration: Adicionar colunas para trilhas por semana e conclusão na tabela study_plans
-- Execute este script no Supabase SQL Editor se as colunas não existirem

ALTER TABLE study_plans
ADD COLUMN IF NOT EXISTS trilhas_por_semana JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS trilha_conclusao JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS trilha_semanal JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS planning_config JSONB DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN study_plans.trilhas_por_semana IS 'Armazena as trilhas organizadas por semana (chave: weekKey, valor: TrilhaSemanalData)';
COMMENT ON COLUMN study_plans.trilha_conclusao IS 'Armazena o estado de conclusão dos tópicos na trilha (chave: weekKey-diaId-topicId, valor: boolean)';
COMMENT ON COLUMN study_plans.trilha_semanal IS 'Trilha semanal antiga (mantida para compatibilidade)';
COMMENT ON COLUMN study_plans.planning_config IS 'Configurações de planejamento de estudos';




