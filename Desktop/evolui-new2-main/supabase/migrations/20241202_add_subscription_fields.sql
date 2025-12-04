-- Adicionar campos de subscription ao profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'premium')),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.plan_type IS 'Tipo de plano: free, pro, premium';
COMMENT ON COLUMN profiles.trial_ends_at IS 'Data de término do período de teste (7 dias)';
COMMENT ON COLUMN profiles.subscription_ends_at IS 'Data de término da assinatura paga';

-- Criar índice para melhor performance em consultas de planos
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON profiles(plan_type);



