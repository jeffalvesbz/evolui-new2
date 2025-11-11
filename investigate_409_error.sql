-- ============================================
-- INVESTIGAÇÃO: Erro 409 ao criar study_plans
-- ============================================
-- Execute este script para verificar possíveis causas do erro 409
-- ============================================

-- 1. Verificar constraints únicas na tabela study_plans
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name = 'study_plans'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
ORDER BY tc.constraint_type, tc.constraint_name;

-- 2. Verificar políticas RLS para INSERT em study_plans
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operacao,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename = 'study_plans'
    AND cmd = 'INSERT';

-- 3. Verificar se há registros duplicados (caso tenha constraint única)
SELECT 
    user_id,
    nome,
    COUNT(*) as quantidade
FROM study_plans
GROUP BY user_id, nome
HAVING COUNT(*) > 1;

-- 4. Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'study_plans'
ORDER BY ordinal_position;

-- 5. Verificar foreign keys que podem causar erro
SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = 'study_plans';

-- ============================================
-- POSSÍVEIS SOLUÇÕES
-- ============================================

-- Se o erro 409 for por constraint única, você pode:
-- 1. Remover a constraint (se não for necessária)
-- 2. Verificar se está tentando criar registro duplicado
-- 3. Usar UPSERT (INSERT ... ON CONFLICT) em vez de INSERT

-- Se o erro 409 for por RLS:
-- 1. Verificar se a política de INSERT está correta
-- 2. Verificar se o usuário está autenticado
-- 3. Verificar se o user_id está sendo passado corretamente



