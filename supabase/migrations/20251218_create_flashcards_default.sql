-- Migration: Create default flashcard decks system
-- Date: 2025-12-18

-- =============================================================================
-- 1. TABLE: flashcard_decks_default (Decks padrão de flashcards)
-- =============================================================================
CREATE TABLE IF NOT EXISTS flashcard_decks_default (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  visivel BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. TABLE: flashcards_default (Flashcards dentro dos decks padrão)
-- =============================================================================
CREATE TABLE IF NOT EXISTS flashcards_default (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES flashcard_decks_default(id) ON DELETE CASCADE NOT NULL,
  pergunta TEXT NOT NULL,
  resposta TEXT NOT NULL,
  tags TEXT[],
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. ADD is_default column to user flashcards (to prevent export)
-- =============================================================================
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- =============================================================================
-- 4. RLS POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE flashcard_decks_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards_default ENABLE ROW LEVEL SECURITY;

-- Decks: Public read (visible only), Admin full access
DROP POLICY IF EXISTS "Public Read Visible Decks" ON flashcard_decks_default;
CREATE POLICY "Public Read Visible Decks" ON flashcard_decks_default 
  FOR SELECT USING (visivel = true);

DROP POLICY IF EXISTS "Admin Full Access Decks" ON flashcard_decks_default;
CREATE POLICY "Admin Full Access Decks" ON flashcard_decks_default 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- Flashcards: Public read (if deck visible), Admin full access
DROP POLICY IF EXISTS "Public Read Visible Flashcards" ON flashcards_default;
CREATE POLICY "Public Read Visible Flashcards" ON flashcards_default 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM flashcard_decks_default WHERE id = deck_id AND visivel = true)
  );

DROP POLICY IF EXISTS "Admin Full Access Flashcards Default" ON flashcards_default;
CREATE POLICY "Admin Full Access Flashcards Default" ON flashcards_default 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)
  );

-- =============================================================================
-- 5. INDEXES for performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_flashcards_default_deck_id ON flashcards_default(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_decks_default_visivel ON flashcard_decks_default(visivel);
CREATE INDEX IF NOT EXISTS idx_flashcards_is_default ON flashcards(is_default);
