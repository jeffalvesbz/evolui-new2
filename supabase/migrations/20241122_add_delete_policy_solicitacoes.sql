-- Add DELETE policy for solicitacoes_editais
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can delete all solicitacoes" ON solicitacoes_editais;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes_editais;

-- Admins can delete all requests
CREATE POLICY "Admins can delete all solicitacoes"
  ON solicitacoes_editais
  FOR DELETE
  USING (true);

-- Users can delete their own requests
CREATE POLICY "Users can delete own solicitacoes"
  ON solicitacoes_editais
  FOR DELETE
  USING (auth.uid() = user_id);

