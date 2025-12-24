-- 🎁 Script para liberar acesso Premium por 10 dias para Testers
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard/project/_/sql)

-- ============================================================================
-- OPÇÃO 1: Liberar para um ou mais emails específicos (RECOMENDADO)
-- ============================================================================

UPDATE public.profiles
SET 
    plan_type = 'premium', -- Define o plano como Premium
    subscription_ends_at = NOW() + INTERVAL '10 days', -- Define expiração para daqui a 10 dias
    updated_at = NOW()
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN (
        'teste1@email.com',
        'teste2@email.com',
        'jefferson.teste@email.com'
        -- Adicione mais emails aqui se necessário
    )
);

-- ============================================================================
-- OPÇÃO 2: Verificar quem tem acesso Premium atualmente
-- ============================================================================

SELECT 
    p.user_id,
    u.email,
    p.plan_type,
    p.subscription_ends_at
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id
WHERE p.plan_type = 'premium';

-- ============================================================================
-- NOTA:
-- O campo 'subscription_ends_at' é usado pelo sistema para verificar a validade.
-- Quando passar a data, o usuário voltará automaticamente para o plano Free 
-- (conforme lógica do front-end que checa a data).
-- ============================================================================
