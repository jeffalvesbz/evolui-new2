-- Migration: Adicionar campo active_edital_id na tabela profiles
-- Este campo armazena o ID do último edital selecionado pelo usuário

-- Adicionar coluna active_edital_id
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_edital_id UUID REFERENCES study_plans(id) ON DELETE SET NULL;

-- Adicionar comentário
COMMENT ON COLUMN profiles.active_edital_id IS 'ID do último edital selecionado pelo usuário';

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_active_edital_id ON profiles(active_edital_id);



