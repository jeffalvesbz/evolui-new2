-- Adicionar campo has_seen_onboarding na tabela profiles
-- Execute este script no SQL Editor do Supabase Dashboard

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;

-- Comentário explicativo
COMMENT ON COLUMN profiles.has_seen_onboarding IS 'Indica se o usuário já viu o tutorial de onboarding';




