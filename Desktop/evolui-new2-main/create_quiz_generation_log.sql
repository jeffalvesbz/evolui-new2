-- Criar tabela para rastrear geração de quizzes
CREATE TABLE IF NOT EXISTS quiz_generation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_quiz_generation_log_user_date 
ON quiz_generation_log(user_id, created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE quiz_generation_log ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seus próprios registros
CREATE POLICY "Users can view their own quiz generation logs"
ON quiz_generation_log
FOR SELECT
USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios registros
CREATE POLICY "Users can insert their own quiz generation logs"
ON quiz_generation_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE quiz_generation_log IS 'Registra a geração de questões de quiz para controle de limites diários';
COMMENT ON COLUMN quiz_generation_log.user_id IS 'ID do usuário que gerou o quiz';
COMMENT ON COLUMN quiz_generation_log.question_count IS 'Número de questões geradas nesta operação';
COMMENT ON COLUMN quiz_generation_log.created_at IS 'Data e hora da geração';
