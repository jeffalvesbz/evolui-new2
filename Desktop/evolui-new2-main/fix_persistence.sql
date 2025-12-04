-- Execute este script no SQL Editor do Supabase Dashboard para corrigir a persistência

-- 1. Adicionar a constraint UNIQUE necessária para o UPSERT funcionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_deck'
    ) THEN
        ALTER TABLE flashcard_study_sessions 
        ADD CONSTRAINT unique_user_deck UNIQUE (user_id, deck_id);
    END IF;
END $$;

-- 2. Garantir que RLS está habilitado
ALTER TABLE flashcard_study_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Recriar políticas de segurança para garantir acesso correto
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
