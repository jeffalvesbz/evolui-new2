-- ============================================
-- SCHEMA COMPLETO DO BANCO DE DADOS
-- Evolui: Planejador de Estudos
-- ============================================
-- Este script cria todo o banco de dados do zero
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================

-- ============================================
-- 1. LIMPEZA (OPCIONAL - Descomente se necessário)
-- ============================================
-- ATENÇÃO: Isso apagará TODOS os dados existentes!
-- Descomente apenas se quiser recriar tudo do zero

-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- ============================================
-- 2. CRIAÇÃO DOS ENUMS
-- ============================================

-- Enum para eventos de XP
DROP TYPE IF EXISTS xp_log_event CASCADE;
CREATE TYPE xp_log_event AS ENUM (
    'session_completed',
    'study_session',
    'flashcard_reviewed',
    'revision_completed',
    'error_resolved',
    'daily_goal_achieved',
    'streak_milestone',
    'badge_unlocked'
);

-- Enum para status de revisão
DROP TYPE IF EXISTS revisao_status CASCADE;
CREATE TYPE revisao_status AS ENUM (
    'pendente',
    'concluida',
    'atrasada'
);

-- Enum para nível de dificuldade
DROP TYPE IF EXISTS nivel_dificuldade CASCADE;
CREATE TYPE nivel_dificuldade AS ENUM (
    'facil',
    'medio',
    'dificil',
    'desconhecido'
);

-- Enum para origem da revisão
DROP TYPE IF EXISTS origem_revisao CASCADE;
CREATE TYPE origem_revisao AS ENUM (
    'flashcard',
    'erro',
    'manual',
    'teorica'
);

-- Enum para status de amizade
DROP TYPE IF EXISTS friendship_status CASCADE;
CREATE TYPE friendship_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'blocked'
);

-- Enum para estilo de flashcard
DROP TYPE IF EXISTS estilo_flashcard CASCADE;
CREATE TYPE estilo_flashcard AS ENUM (
    'direto',
    'explicativo',
    'completar'
);

-- ============================================
-- 3. CRIAÇÃO DAS TABELAS
-- ============================================

-- Tabela: profiles (perfis de usuário)
CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    xp_total INTEGER DEFAULT 0 NOT NULL,
    current_streak_days INTEGER DEFAULT 0 NOT NULL,
    best_streak_days INTEGER DEFAULT 0 NOT NULL,
    has_seen_onboarding BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE profiles IS 'Perfis de usuários do sistema';
COMMENT ON COLUMN profiles.xp_total IS 'Total de pontos de experiência acumulados';
COMMENT ON COLUMN profiles.current_streak_days IS 'Sequência atual de dias estudando';
COMMENT ON COLUMN profiles.best_streak_days IS 'Melhor sequência de dias estudando';
COMMENT ON COLUMN profiles.has_seen_onboarding IS 'Indica se o usuário já viu o tutorial de onboarding';

-- Tabela: badges (conquistas/badges do sistema)
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp INTEGER NOT NULL,
    is_secret BOOLEAN DEFAULT FALSE NOT NULL
);

COMMENT ON TABLE badges IS 'Badges/conquistas disponíveis no sistema';

-- Tabela: user_badges (badges desbloqueados por usuários)
CREATE TABLE IF NOT EXISTS user_badges (
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, badge_id)
);

COMMENT ON TABLE user_badges IS 'Badges desbloqueados por cada usuário';

-- Tabela: xp_log (log de eventos de XP)
CREATE TABLE IF NOT EXISTS xp_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    event xp_log_event NOT NULL,
    amount INTEGER NOT NULL,
    meta_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE xp_log IS 'Log de todos os eventos que geram XP';
COMMENT ON COLUMN xp_log.event IS 'Tipo de evento que gerou o XP';
COMMENT ON COLUMN xp_log.amount IS 'Quantidade de XP ganha no evento';
COMMENT ON COLUMN xp_log.meta_json IS 'Metadados adicionais do evento em formato JSON';

-- Tabela: study_plans (planos de estudo)
CREATE TABLE IF NOT EXISTS study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    data_alvo DATE,
    banca TEXT,
    orgao TEXT,
    trilhas_por_semana JSONB DEFAULT '{}'::jsonb,
    trilha_conclusao JSONB DEFAULT '{}'::jsonb,
    trilha_semanal JSONB,
    planning_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE study_plans IS 'Planos de estudo dos usuários';
COMMENT ON COLUMN study_plans.trilhas_por_semana IS 'Armazena as trilhas organizadas por semana (chave: weekKey, valor: TrilhaSemanalData)';
COMMENT ON COLUMN study_plans.trilha_conclusao IS 'Armazena o estado de conclusão dos tópicos na trilha (chave: weekKey-diaId-topicId, valor: boolean)';
COMMENT ON COLUMN study_plans.trilha_semanal IS 'Trilha semanal antiga (mantida para compatibilidade)';
COMMENT ON COLUMN study_plans.planning_config IS 'Configurações de planejamento de estudos';

-- Tabela: disciplinas (disciplinas de cada plano)
CREATE TABLE IF NOT EXISTS disciplinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    anotacoes TEXT,
    progresso INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE disciplinas IS 'Disciplinas de cada plano de estudo';
COMMENT ON COLUMN disciplinas.progresso IS 'Progresso da disciplina em percentual (0-100)';

-- Tabela: topicos (tópicos de cada disciplina)
CREATE TABLE IF NOT EXISTS topicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    concluido BOOLEAN DEFAULT FALSE NOT NULL,
    nivel_dificuldade TEXT DEFAULT 'desconhecido' NOT NULL,
    ultima_revisao TIMESTAMPTZ,
    proxima_revisao TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE topicos IS 'Tópicos de cada disciplina';
COMMENT ON COLUMN topicos.nivel_dificuldade IS 'Nível de dificuldade: facil, medio, dificil, desconhecido';

-- Tabela: sessoes_estudo (sessões de estudo registradas)
CREATE TABLE IF NOT EXISTS sessoes_estudo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    topico_id UUID NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
    tempo_estudado INTEGER NOT NULL,
    data_estudo DATE NOT NULL,
    comentarios TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE sessoes_estudo IS 'Sessões de estudo registradas pelos usuários';
COMMENT ON COLUMN sessoes_estudo.tempo_estudado IS 'Tempo estudado em segundos';

-- Tabela: revisoes (revisões agendadas)
CREATE TABLE IF NOT EXISTS revisoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    topico_id UUID NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    data_prevista DATE NOT NULL,
    status TEXT DEFAULT 'pendente' NOT NULL,
    origem TEXT NOT NULL,
    dificuldade TEXT DEFAULT 'desconhecido' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE revisoes IS 'Revisões agendadas para os tópicos';
COMMENT ON COLUMN revisoes.status IS 'Status: pendente, concluida, atrasada';
COMMENT ON COLUMN revisoes.origem IS 'Origem: flashcard, erro, manual, teorica';
COMMENT ON COLUMN revisoes.dificuldade IS 'Dificuldade: facil, medio, dificil, desconhecido';

-- Tabela: flashcards (cartões de estudo)
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    topico_id UUID NOT NULL REFERENCES topicos(id) ON DELETE CASCADE,
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    interval INTEGER DEFAULT 1 NOT NULL,
    ease_factor NUMERIC(5,2) DEFAULT 2.5 NOT NULL,
    due_date DATE NOT NULL,
    estilo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE flashcards IS 'Flashcards para estudo com sistema SRS (Spaced Repetition System)';
COMMENT ON COLUMN flashcards.interval IS 'Intervalo em dias até a próxima revisão';
COMMENT ON COLUMN flashcards.ease_factor IS 'Fator de facilidade (usado no algoritmo SRS)';
COMMENT ON COLUMN flashcards.due_date IS 'Data prevista para próxima revisão';
COMMENT ON COLUMN flashcards.estilo IS 'Estilo: direto, explicativo, completar';

-- Tabela: caderno_erros (caderno de erros)
CREATE TABLE IF NOT EXISTS caderno_erros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    topico_id UUID REFERENCES topicos(id) ON DELETE SET NULL,
    assunto TEXT NOT NULL,
    descricao TEXT NOT NULL,
    resolvido BOOLEAN DEFAULT FALSE NOT NULL,
    data DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE caderno_erros IS 'Caderno de erros dos usuários';

-- Tabela: simulados (simulados realizados)
CREATE TABLE IF NOT EXISTS simulados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    correct INTEGER NOT NULL,
    wrong INTEGER NOT NULL,
    blank INTEGER,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    date DATE NOT NULL,
    is_cebraspe BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE simulados IS 'Simulados realizados pelos usuários';

-- Tabela: redacoes_corrigidas (redações corrigidas)
CREATE TABLE IF NOT EXISTS redacoes_corrigidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    texto TEXT NOT NULL,
    banca TEXT NOT NULL,
    nota_maxima INTEGER NOT NULL,
    tema TEXT,
    correcao JSONB NOT NULL,
    data DATE DEFAULT CURRENT_DATE NOT NULL
);

COMMENT ON TABLE redacoes_corrigidas IS 'Redações corrigidas pelo sistema';
COMMENT ON COLUMN redacoes_corrigidas.correcao IS 'Correção completa em formato JSON';

-- Tabela: ciclos (ciclos de estudos)
CREATE TABLE IF NOT EXISTS ciclos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE ciclos IS 'Ciclos de estudos dos usuários';

-- Tabela: sessoes_ciclo (sessões de um ciclo)
CREATE TABLE IF NOT EXISTS sessoes_ciclo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    ciclo_id UUID NOT NULL REFERENCES ciclos(id) ON DELETE CASCADE,
    disciplina_id UUID NOT NULL REFERENCES disciplinas(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    tempo_previsto INTEGER NOT NULL
);

COMMENT ON TABLE sessoes_ciclo IS 'Sessões que compõem um ciclo de estudos';
COMMENT ON COLUMN sessoes_ciclo.tempo_previsto IS 'Tempo previsto em segundos';

-- Tabela: friendships (amizades entre usuários)
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_different_users CHECK (user_id_1 != user_id_2),
    CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2)
);

COMMENT ON TABLE friendships IS 'Amizades e solicitações de amizade entre usuários';
COMMENT ON COLUMN friendships.status IS 'Status: pending, accepted, declined, blocked';
COMMENT ON COLUMN friendships.user_id_1 IS 'Usuário que enviou a solicitação';
COMMENT ON COLUMN friendships.user_id_2 IS 'Usuário que recebeu a solicitação';

-- ============================================
-- 4. CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Índices para xp_log
CREATE INDEX IF NOT EXISTS idx_xp_log_user_id ON xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_log_created_at ON xp_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_log_event ON xp_log(event);

-- Índices para study_plans
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_created_at ON study_plans(created_at DESC);

-- Índices para disciplinas
CREATE INDEX IF NOT EXISTS idx_disciplinas_user_id ON disciplinas(user_id);
CREATE INDEX IF NOT EXISTS idx_disciplinas_study_plan_id ON disciplinas(study_plan_id);

-- Índices para topicos
CREATE INDEX IF NOT EXISTS idx_topicos_user_id ON topicos(user_id);
CREATE INDEX IF NOT EXISTS idx_topicos_disciplina_id ON topicos(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_topicos_proxima_revisao ON topicos(proxima_revisao) WHERE proxima_revisao IS NOT NULL;

-- Índices para sessoes_estudo
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_user_id ON sessoes_estudo(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_study_plan_id ON sessoes_estudo(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_topico_id ON sessoes_estudo(topico_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_estudo_data_estudo ON sessoes_estudo(data_estudo DESC);

-- Índices para revisoes
CREATE INDEX IF NOT EXISTS idx_revisoes_user_id ON revisoes(user_id);
CREATE INDEX IF NOT EXISTS idx_revisoes_study_plan_id ON revisoes(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_revisoes_topico_id ON revisoes(topico_id);
CREATE INDEX IF NOT EXISTS idx_revisoes_data_prevista ON revisoes(data_prevista);
CREATE INDEX IF NOT EXISTS idx_revisoes_status ON revisoes(status) WHERE status = 'pendente';

-- Índices para flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_topico_id ON flashcards(topico_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_due_date ON flashcards(due_date);

-- Índices para caderno_erros
CREATE INDEX IF NOT EXISTS idx_caderno_erros_user_id ON caderno_erros(user_id);
CREATE INDEX IF NOT EXISTS idx_caderno_erros_study_plan_id ON caderno_erros(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_caderno_erros_disciplina_id ON caderno_erros(disciplina_id);
CREATE INDEX IF NOT EXISTS idx_caderno_erros_resolvido ON caderno_erros(resolvido) WHERE resolvido = FALSE;

-- Índices para simulados
CREATE INDEX IF NOT EXISTS idx_simulados_user_id ON simulados(user_id);
CREATE INDEX IF NOT EXISTS idx_simulados_study_plan_id ON simulados(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_simulados_date ON simulados(date DESC);

-- Índices para redacoes_corrigidas
CREATE INDEX IF NOT EXISTS idx_redacoes_corrigidas_user_id ON redacoes_corrigidas(user_id);
CREATE INDEX IF NOT EXISTS idx_redacoes_corrigidas_study_plan_id ON redacoes_corrigidas(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_redacoes_corrigidas_data ON redacoes_corrigidas(data DESC);

-- Índices para ciclos
CREATE INDEX IF NOT EXISTS idx_ciclos_user_id ON ciclos(user_id);
CREATE INDEX IF NOT EXISTS idx_ciclos_study_plan_id ON ciclos(study_plan_id);

-- Índices para sessoes_ciclo
CREATE INDEX IF NOT EXISTS idx_sessoes_ciclo_user_id ON sessoes_ciclo(user_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_ciclo_ciclo_id ON sessoes_ciclo(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_ciclo_disciplina_id ON sessoes_ciclo(disciplina_id);

-- Índices para friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user_id_1 ON friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id_2 ON friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Índices para user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- ============================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================

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
-- 6. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- ============================================
-- POLÍTICAS PARA TABELA: profiles
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
-- POLÍTICAS PARA TABELA: badges
-- ============================================
DROP POLICY IF EXISTS "Anyone can view badges" ON badges;

CREATE POLICY "Anyone can view badges"
    ON badges FOR SELECT
    USING (true);

-- ============================================
-- POLÍTICAS PARA TABELA: user_badges
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
-- POLÍTICAS PARA TABELA: xp_log
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
-- POLÍTICAS PARA TABELA: study_plans
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
-- POLÍTICAS PARA TABELA: disciplinas
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
-- POLÍTICAS PARA TABELA: topicos
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
-- POLÍTICAS PARA TABELA: sessoes_estudo
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
-- POLÍTICAS PARA TABELA: redacoes_corrigidas
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
-- POLÍTICAS PARA TABELA: simulados
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
-- POLÍTICAS PARA TABELA: revisoes
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
-- POLÍTICAS PARA TABELA: caderno_erros
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
-- POLÍTICAS PARA TABELA: ciclos
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
-- POLÍTICAS PARA TABELA: sessoes_ciclo
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
-- POLÍTICAS PARA TABELA: flashcards
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
-- POLÍTICAS PARA TABELA: friendships
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
-- FIM DO SCRIPT
-- ============================================
-- 
-- NOTAS IMPORTANTES:
-- 1. Este script cria todo o banco de dados do zero
-- 2. Todas as tabelas têm RLS habilitado
-- 3. Todas as políticas de segurança estão configuradas
-- 4. Índices foram criados para otimizar consultas frequentes
-- 5. Foreign keys garantem integridade referencial
-- 6. Para recriar tudo, descomente a seção de limpeza no início
-- 
-- PRÓXIMOS PASSOS:
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se todas as tabelas foram criadas
-- 3. Teste as políticas RLS fazendo queries autenticadas
-- 4. Gere os tipos TypeScript: supabase gen types typescript --linked > types/supabase.ts
-- ============================================

