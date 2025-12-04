-- ============================================
-- SCRIPT DE VERIFICAÇÃO DO BANCO DE DADOS
-- Execute este script para verificar se tudo foi criado corretamente
-- ============================================

-- 1. Verificar todas as tabelas criadas
SELECT 
    'Tabelas criadas:' as verificacao,
    COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar todos os enums criados
SELECT 
    'Enums criados:' as verificacao,
    COUNT(*) as total
FROM pg_type 
WHERE typtype = 'e';

SELECT typname as enum_name
FROM pg_type 
WHERE typtype = 'e' 
ORDER BY typname;

-- 3. Verificar políticas RLS
SELECT 
    'Políticas RLS:' as verificacao,
    COUNT(*) as total
FROM pg_policies 
WHERE schemaname = 'public';

SELECT 
    tablename,
    policyname,
    cmd as operacao
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verificar se RLS está habilitado em todas as tabelas
SELECT 
    'RLS habilitado:' as verificacao,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Verificar índices criados
SELECT 
    'Índices criados:' as verificacao,
    COUNT(*) as total
FROM pg_indexes 
WHERE schemaname = 'public';

SELECT 
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. Verificar foreign keys
SELECT 
    'Foreign Keys:' as verificacao,
    COUNT(*) as total
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_schema = 'public';

SELECT 
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 7. Resumo final
SELECT 
    '=== RESUMO ===' as info,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tabelas,
    (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e') as total_enums,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_politicas,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indices,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') as total_foreign_keys;

