-- ============================================
-- CORREÇÃO DO ENUM xp_log_event
-- ============================================
-- Este script adiciona o valor 'study_session' ao enum xp_log_event
-- Execute este script no SQL Editor do Supabase Dashboard
-- ============================================

-- Verificar se o enum existe e adicionar o valor 'study_session' se não existir
DO $$ 
BEGIN
    -- Adicionar 'study_session' ao enum se ainda não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'study_session' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'xp_log_event')
    ) THEN
        ALTER TYPE xp_log_event ADD VALUE 'study_session';
    END IF;
END $$;

-- ============================================
-- NOTA: Se você receber um erro dizendo que o enum não existe,
-- você precisa primeiro criar o enum com os valores válidos:
-- 
-- CREATE TYPE xp_log_event AS ENUM (
--     'session_completed',
--     'study_session',
--     'flashcard_reviewed',
--     'revision_completed',
--     'error_resolved',
--     'daily_goal_achieved',
--     'streak_milestone',
--     'badge_unlocked'
-- );
-- ============================================

