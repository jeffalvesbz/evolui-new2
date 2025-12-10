-- ============================================
-- POLÍTICAS RLS (Row Level Security) PARA SUPABASE
-- Evolui: Planejador de Estudos
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- Este script remove políticas existentes antes de criar novas
-- ============================================

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_estudo ENABLE ROW LEVEL SECURITY;
ALTER TABLE redacoes_corrigidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE caderno_erros ENABLE ROW LEVEL SECURITY;
ALTER TABLE ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_ciclo ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. POLÍTICAS PARA TABELA: profiles
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view friends profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view public profiles for ranking" ON profiles;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view friends profiles"
    ON profiles FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id_1 FROM friendships 
            WHERE user_id_2 = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id_2 FROM friendships 
            WHERE user_id_1 = auth.uid() AND status = 'accepted'
        )
    );

-- Permitir que usuários autenticados vejam perfis públicos (apenas dados básicos) para o ranking global
CREATE POLICY "Users can view public profiles for ranking"
    ON profiles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- 3. POLÍTICAS PARA TABELA: badges
-- ============================================
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;

CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    USING (true);

-- ============================================
-- 4. POLÍTICAS PARA TABELA: user_badges
-- ============================================
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can insert own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can delete own badges" ON user_badges;

CREATE POLICY "Users can view own badges"
    ON user_badges FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
    ON user_badges FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own badges"
    ON user_badges FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 5. POLÍTICAS PARA TABELA: xp_log
-- ============================================
DROP POLICY IF EXISTS "Users can view own xp_log" ON xp_log;
DROP POLICY IF EXISTS "Users can insert own xp_log" ON xp_log;
DROP POLICY IF EXISTS "Users can view friends xp for ranking" ON xp_log;

CREATE POLICY "Users can view own xp_log"
    ON xp_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own xp_log"
    ON xp_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view friends xp for ranking"
    ON xp_log FOR SELECT
    USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT user_id_1 FROM friendships 
            WHERE user_id_2 = auth.uid() AND status = 'accepted'
            UNION
            SELECT user_id_2 FROM friendships 
            WHERE user_id_1 = auth.uid() AND status = 'accepted'
        )
    );

-- ============================================
-- 6. POLÍTICAS PARA TABELA: study_plans
-- ============================================
DROP POLICY IF EXISTS "Users can view own study_plans" ON study_plans;
DROP POLICY IF EXISTS "Users can insert own study_plans" ON study_plans;
DROP POLICY IF EXISTS "Users can update own study_plans" ON study_plans;
DROP POLICY IF EXISTS "Users can delete own study_plans" ON study_plans;

CREATE POLICY "Users can view own study_plans"
    ON study_plans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study_plans"
    ON study_plans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study_plans"
    ON study_plans FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study_plans"
    ON study_plans FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 7. POLÍTICAS PARA TABELA: disciplinas
-- ============================================
DROP POLICY IF EXISTS "Users can view own disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Users can insert own disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Users can update own disciplinas" ON disciplinas;
DROP POLICY IF EXISTS "Users can delete own disciplinas" ON disciplinas;

CREATE POLICY "Users can view own disciplinas"
    ON disciplinas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own disciplinas"
    ON disciplinas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own disciplinas"
    ON disciplinas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own disciplinas"
    ON disciplinas FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 8. POLÍTICAS PARA TABELA: topicos
-- ============================================
DROP POLICY IF EXISTS "Users can view own topicos" ON topicos;
DROP POLICY IF EXISTS "Users can insert own topicos" ON topicos;
DROP POLICY IF EXISTS "Users can update own topicos" ON topicos;
DROP POLICY IF EXISTS "Users can delete own topicos" ON topicos;

CREATE POLICY "Users can view own topicos"
    ON topicos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topicos"
    ON topicos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topicos"
    ON topicos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own topicos"
    ON topicos FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 9. POLÍTICAS PARA TABELA: sessoes_estudo
-- ============================================
DROP POLICY IF EXISTS "Users can view own sessoes_estudo" ON sessoes_estudo;
DROP POLICY IF EXISTS "Users can insert own sessoes_estudo" ON sessoes_estudo;
DROP POLICY IF EXISTS "Users can update own sessoes_estudo" ON sessoes_estudo;
DROP POLICY IF EXISTS "Users can delete own sessoes_estudo" ON sessoes_estudo;

CREATE POLICY "Users can view own sessoes_estudo"
    ON sessoes_estudo FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessoes_estudo"
    ON sessoes_estudo FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessoes_estudo"
    ON sessoes_estudo FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessoes_estudo"
    ON sessoes_estudo FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 10. POLÍTICAS PARA TABELA: redacoes_corrigidas
-- ============================================
DROP POLICY IF EXISTS "Users can view own redacoes_corrigidas" ON redacoes_corrigidas;
DROP POLICY IF EXISTS "Users can insert own redacoes_corrigidas" ON redacoes_corrigidas;
DROP POLICY IF EXISTS "Users can update own redacoes_corrigidas" ON redacoes_corrigidas;
DROP POLICY IF EXISTS "Users can delete own redacoes_corrigidas" ON redacoes_corrigidas;

CREATE POLICY "Users can view own redacoes_corrigidas"
    ON redacoes_corrigidas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redacoes_corrigidas"
    ON redacoes_corrigidas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own redacoes_corrigidas"
    ON redacoes_corrigidas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own redacoes_corrigidas"
    ON redacoes_corrigidas FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 11. POLÍTICAS PARA TABELA: simulados
-- ============================================
DROP POLICY IF EXISTS "Users can view own simulados" ON simulados;
DROP POLICY IF EXISTS "Users can insert own simulados" ON simulados;
DROP POLICY IF EXISTS "Users can update own simulados" ON simulados;
DROP POLICY IF EXISTS "Users can delete own simulados" ON simulados;

CREATE POLICY "Users can view own simulados"
    ON simulados FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulados"
    ON simulados FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulados"
    ON simulados FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulados"
    ON simulados FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 12. POLÍTICAS PARA TABELA: revisoes
-- ============================================
DROP POLICY IF EXISTS "Users can view own revisoes" ON revisoes;
DROP POLICY IF EXISTS "Users can insert own revisoes" ON revisoes;
DROP POLICY IF EXISTS "Users can update own revisoes" ON revisoes;
DROP POLICY IF EXISTS "Users can delete own revisoes" ON revisoes;

CREATE POLICY "Users can view own revisoes"
    ON revisoes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own revisoes"
    ON revisoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revisoes"
    ON revisoes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own revisoes"
    ON revisoes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 13. POLÍTICAS PARA TABELA: caderno_erros
-- ============================================
DROP POLICY IF EXISTS "Users can view own caderno_erros" ON caderno_erros;
DROP POLICY IF EXISTS "Users can insert own caderno_erros" ON caderno_erros;
DROP POLICY IF EXISTS "Users can update own caderno_erros" ON caderno_erros;
DROP POLICY IF EXISTS "Users can delete own caderno_erros" ON caderno_erros;

CREATE POLICY "Users can view own caderno_erros"
    ON caderno_erros FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own caderno_erros"
    ON caderno_erros FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own caderno_erros"
    ON caderno_erros FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own caderno_erros"
    ON caderno_erros FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 14. POLÍTICAS PARA TABELA: ciclos
-- ============================================
DROP POLICY IF EXISTS "Users can view own ciclos" ON ciclos;
DROP POLICY IF EXISTS "Users can insert own ciclos" ON ciclos;
DROP POLICY IF EXISTS "Users can update own ciclos" ON ciclos;
DROP POLICY IF EXISTS "Users can delete own ciclos" ON ciclos;

CREATE POLICY "Users can view own ciclos"
    ON ciclos FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ciclos"
    ON ciclos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ciclos"
    ON ciclos FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ciclos"
    ON ciclos FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 15. POLÍTICAS PARA TABELA: sessoes_ciclo
-- ============================================
DROP POLICY IF EXISTS "Users can view own sessoes_ciclo" ON sessoes_ciclo;
DROP POLICY IF EXISTS "Users can insert own sessoes_ciclo" ON sessoes_ciclo;
DROP POLICY IF EXISTS "Users can update own sessoes_ciclo" ON sessoes_ciclo;
DROP POLICY IF EXISTS "Users can delete own sessoes_ciclo" ON sessoes_ciclo;

CREATE POLICY "Users can view own sessoes_ciclo"
    ON sessoes_ciclo FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessoes_ciclo"
    ON sessoes_ciclo FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessoes_ciclo"
    ON sessoes_ciclo FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessoes_ciclo"
    ON sessoes_ciclo FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 16. POLÍTICAS PARA TABELA: flashcards
-- ============================================
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards;

CREATE POLICY "Users can view own flashcards"
    ON flashcards FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards"
    ON flashcards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards"
    ON flashcards FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards"
    ON flashcards FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- 17. POLÍTICAS PARA TABELA: friendships
-- ============================================
DROP POLICY IF EXISTS "Users can view own friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert own friend requests" ON friendships;
DROP POLICY IF EXISTS "Users can update received friend requests" ON friendships;
DROP POLICY IF EXISTS "Users can delete own friendships" ON friendships;

CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (
        auth.uid() = user_id_1 OR 
        auth.uid() = user_id_2
    );

CREATE POLICY "Users can insert own friend requests"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id_1);

CREATE POLICY "Users can update received friend requests"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id_2)
    WITH CHECK (auth.uid() = user_id_2);

CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (
        auth.uid() = user_id_1 OR 
        auth.uid() = user_id_2
    );

-- ============================================
-- FIM DAS POLÍTICAS RLS
-- ============================================
-- 
-- NOTAS:
-- 1. Todas as políticas permitem que usuários vejam/editem apenas seus próprios dados
-- 2. Exceções: badges (públicos) e profiles/friendships (amigos podem ver)
-- 3. Execute este script no SQL Editor do Supabase Dashboard
-- 4. Certifique-se de que o usuário está autenticado antes de fazer queries
-- 5. O script remove políticas existentes antes de criar novas (idempotente)
-- ============================================
