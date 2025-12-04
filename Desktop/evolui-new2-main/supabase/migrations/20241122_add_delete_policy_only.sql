-- Apenas adicionar política de DELETE (se não existir)
-- Execute este script se já tiver executado a migration principal

-- Verificar e criar apenas a política de DELETE para admins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'solicitacoes_editais' 
        AND policyname = 'Admins can delete all solicitacoes'
    ) THEN
        CREATE POLICY "Admins can delete all solicitacoes"
          ON solicitacoes_editais
          FOR DELETE
          USING (true);
    END IF;
END $$;

-- Verificar e criar apenas a política de DELETE para usuários
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'solicitacoes_editais' 
        AND policyname = 'Users can delete own solicitacoes'
    ) THEN
        CREATE POLICY "Users can delete own solicitacoes"
          ON solicitacoes_editais
          FOR DELETE
          USING (auth.uid() = user_id);
    END IF;
END $$;



