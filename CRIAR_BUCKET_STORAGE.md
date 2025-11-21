# 🪣 Como Criar o Bucket de Storage no Supabase

## Erro: "Bucket not found"

Se você está recebendo este erro, o bucket de storage ainda não foi criado. Siga os passos abaixo:

## Método 1: Criar via SQL (Recomendado)

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole e execute o seguinte SQL:

```sql
-- Criar bucket para PDFs de editais
INSERT INTO storage.buckets (id, name, public)
VALUES ('editais', 'editais', false)
ON CONFLICT (id) DO NOTHING;
```

6. Clique em **Run** (ou `Ctrl+Enter` / `Cmd+Enter`)

## Método 2: Criar via Interface (Alternativo)

1. Acesse o **Supabase Dashboard**
2. No menu lateral, clique em **Storage**
3. Clique em **New bucket**
4. Configure:
   - **Name**: `editais`
   - **Public bucket**: **DESMARCADO** (deixe privado)
5. Clique em **Create bucket**

## Após Criar o Bucket

Execute também as políticas de segurança:

```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON storage.objects;

-- Create policy: Users can upload their own files
CREATE POLICY "Users can upload own solicitacoes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'editais' 
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Create policy: Users can view their own files
CREATE POLICY "Users can view own solicitacoes"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'editais' 
    AND split_part(name, '/', 2) = auth.uid()::text
  );

-- Create policy: Admins can view all files
CREATE POLICY "Admins can view all solicitacoes"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'editais');

-- Create policy: Users can delete their own files
CREATE POLICY "Users can delete own solicitacoes"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'editais' 
    AND split_part(name, '/', 2) = auth.uid()::text
  );
```

## Verificar se Funcionou

Execute este SQL para verificar:

```sql
SELECT * FROM storage.buckets WHERE id = 'editais';
```

Se retornar uma linha, o bucket foi criado com sucesso! ✅

