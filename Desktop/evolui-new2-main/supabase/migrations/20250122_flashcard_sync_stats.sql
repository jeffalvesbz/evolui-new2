-- ============================================
-- MIGRATION: Flashcard Sync & Statistics
-- Data: 2025-01-22
-- Descrição: Adiciona suporte para sincronização de sessões de estudo,
--            histórico de revisões para estatísticas, e tags nos flashcards
-- ============================================

-- ============================================
-- 1. CRIAR TABELA DE SESSÕES DE ESTUDO
-- ============================================

CREATE TABLE IF NOT EXISTS flashcard_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    deck_id TEXT NOT NULL,
    current_index INTEGER NOT NULL DEFAULT 0,
    deck_data JSONB NOT NULL,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    session_start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_deck UNIQUE (user_id, deck_id)
);

COMMENT ON TABLE flashcard_study_sessions IS 'Sessões de estudo ativas dos usuários (sincronizadas entre dispositivos)';
COMMENT ON COLUMN flashcard_study_sessions.deck_id IS 'ID único do deck (gerado pela lógica do app)';
COMMENT ON COLUMN flashcard_study_sessions.deck_data IS 'Array de flashcard IDs do deck';
COMMENT ON COLUMN flashcard_study_sessions.answers IS 'Map de index -> resposta (errei, dificil, bom, facil)';

-- ============================================
-- 2. CRIAR TABELA DE HISTÓRICO DE REVISÕES
-- ============================================

CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
    response_time_ms INTEGER,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE flashcard_reviews IS 'Histórico de todas as revisões de flashcards (para estatísticas e analytics)';
COMMENT ON COLUMN flashcard_reviews.quality IS 'Qualidade da resposta: 0-5 (0=blackout, 1=errei, 3=dificil, 4=bom, 5=facil)';
COMMENT ON COLUMN flashcard_reviews.response_time_ms IS 'Tempo de resposta em milissegundos (opcional)';

-- ============================================
-- 3. ADICIONAR CAMPO DE TAGS AOS FLASHCARDS
-- ============================================

ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN flashcards.tags IS 'Array de tags para categorização e busca (ex: ["importante", "difícil"])';

-- ============================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para flashcard_study_sessions
CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_user_deck 
    ON flashcard_study_sessions(user_id, deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_study_sessions_last_updated 
    ON flashcard_study_sessions(last_updated DESC);

-- Índices para flashcard_reviews
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_id 
    ON flashcard_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard_id 
    ON flashcard_reviews(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_reviewed_at 
    ON flashcard_reviews(reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_reviewed_at 
    ON flashcard_reviews(user_id, reviewed_at DESC);

-- Índice GIN para busca eficiente por tags
CREATE INDEX IF NOT EXISTS idx_flashcards_tags 
    ON flashcards USING GIN(tags);

-- ============================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. CRIAR POLÍTICAS RLS
-- ============================================

-- Políticas para flashcard_study_sessions
DROP POLICY IF EXISTS "Users can view own study sessions" ON flashcard_study_sessions;
DROP POLICY IF EXISTS "Users can insert own study sessions" ON flashcard_study_sessions;
DROP POLICY IF EXISTS "Users can update own study sessions" ON flashcard_study_sessions;
DROP POLICY IF EXISTS "Users can delete own study sessions" ON flashcard_study_sessions;

CREATE POLICY "Users can view own study sessions"
    ON flashcard_study_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sessions"
    ON flashcard_study_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
    ON flashcard_study_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
    ON flashcard_study_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para flashcard_reviews
DROP POLICY IF EXISTS "Users can view own reviews" ON flashcard_reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON flashcard_reviews;

CREATE POLICY "Users can view own reviews"
    ON flashcard_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
    ON flashcard_reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 7. FUNÇÃO PARA LIMPAR SESSÕES ANTIGAS
-- ============================================

-- Função para limpar sessões não atualizadas há mais de 7 dias
CREATE OR REPLACE FUNCTION cleanup_old_study_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM flashcard_study_sessions
    WHERE last_updated < NOW() - INTERVAL '7 days';
END;
$$;

COMMENT ON FUNCTION cleanup_old_study_sessions IS 'Remove sessões de estudo não atualizadas há mais de 7 dias';

-- ============================================
-- MIGRATION COMPLETA
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Após executar, verifique se as tabelas foram criadas corretamente
