-- ============================================
-- CORREÇÃO: Criar perfil automaticamente para usuários
-- ============================================
-- Este script cria uma função e trigger para criar o perfil
-- automaticamente quando um usuário se registra
-- ============================================

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, xp_total, current_streak_days, best_streak_days, has_seen_onboarding)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    0,
    0,
    0,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CORREÇÃO: Permitir que usuários criem seu próprio perfil
-- ============================================
-- Adiciona política para permitir INSERT mesmo se o perfil não existir
-- (a política já existe, mas vamos garantir que está correta)

-- Verificar se a política de INSERT existe e está correta
-- (Já está no database_schema_complete.sql, mas vamos garantir)

-- ============================================
-- CORREÇÃO: Criar perfis para usuários existentes que não têm perfil
-- ============================================
-- Execute esta query para criar perfis para usuários que já existem
-- mas não têm perfil criado

INSERT INTO public.profiles (user_id, name, email, xp_total, current_streak_days, best_streak_days, has_seen_onboarding)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'name', u.email) as name,
  u.email,
  0,
  0,
  0,
  FALSE
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute esta query para verificar se todos os usuários têm perfil:
-- SELECT 
--   u.id,
--   u.email,
--   CASE WHEN p.user_id IS NULL THEN 'SEM PERFIL' ELSE 'OK' END as status
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.user_id;



