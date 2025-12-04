-- ============================================
-- SCRIPT DE MIGRAÇÃO - SISTEMA DE MONETIZAÇÃO
-- Evolui: Planejador de Estudos
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar colunas de assinatura na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Adicionar constraint para plan_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_plan_type_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_plan_type_check 
    CHECK (plan_type IN ('free', 'pro', 'premium'));
  END IF;
END $$;

-- Adicionar constraint para subscription_status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check 
    CHECK (subscription_status IN ('inactive', 'active', 'canceled', 'past_due', 'trialing'));
  END IF;
END $$;

-- 2. Criar tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('pro', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários na tabela subscriptions
COMMENT ON TABLE subscriptions IS 'Assinaturas ativas dos usuários';
COMMENT ON COLUMN subscriptions.plan_type IS 'Tipo de plano: pro ou premium';
COMMENT ON COLUMN subscriptions.status IS 'Status da assinatura: active, canceled, past_due, trialing';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Se true, cancela no final do período atual';

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON subscriptions(current_period_end);

-- 3. Criar tabela de histórico de pagamentos
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('card', 'pix', 'boleto')),
  stripe_payment_intent_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários na tabela payment_history
COMMENT ON TABLE payment_history IS 'Histórico de todos os pagamentos';
COMMENT ON COLUMN payment_history.amount IS 'Valor do pagamento em reais';
COMMENT ON COLUMN payment_history.status IS 'Status: succeeded, failed, pending, refunded';
COMMENT ON COLUMN payment_history.metadata IS 'Metadados adicionais do pagamento em JSON';

-- Índices para payment_history
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_id ON payment_history(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);

-- 4. Habilitar RLS nas novas tabelas
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas RLS para subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Criar políticas RLS para payment_history
DROP POLICY IF EXISTS "Users can view own payment history" ON payment_history;
CREATE POLICY "Users can view own payment history"
  ON payment_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment history" ON payment_history;
CREATE POLICY "Users can insert own payment history"
  ON payment_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 7. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar trigger para atualizar updated_at em subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Criar view para facilitar consultas de assinaturas ativas
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  s.*,
  p.name as user_name,
  p.email as user_email
FROM subscriptions s
JOIN profiles p ON s.user_id = p.user_id
WHERE s.status IN ('active', 'trialing')
  AND s.current_period_end > NOW();

-- Comentário na view
COMMENT ON VIEW active_subscriptions IS 'View com todas as assinaturas ativas e em trial';

-- ============================================
-- SCRIPT CONCLUÍDO
-- ============================================

-- Verificar se tudo foi criado corretamente
SELECT 
  'profiles columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('plan_type', 'trial_ends_at', 'subscription_ends_at', 'subscription_status', 'stripe_customer_id', 'stripe_subscription_id')
UNION ALL
SELECT 
  'subscriptions table' as check_type,
  'exists' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') 
    THEN 'yes' ELSE 'no' END as data_type
UNION ALL
SELECT 
  'payment_history table' as check_type,
  'exists' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history') 
    THEN 'yes' ELSE 'no' END as data_type;
