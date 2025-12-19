-- Add is_deck_only column to disciplinas table
ALTER TABLE disciplinas 
ADD COLUMN IF NOT EXISTS is_deck_only BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN disciplinas.is_deck_only IS 'Indica se a disciplina foi criada automaticamente por um deck de flashcards e não deve aparecer no edital principal';
