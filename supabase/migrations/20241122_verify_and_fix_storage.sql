-- Verificar e criar políticas de storage para o bucket editais
-- Execute este script no Supabase SQL Editor

-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE id = 'editais';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update all solicitacoes" ON storage.objects;

-- Create policy: Users can upload their own files
-- Path format: solicitacoes-editais/{user_id}/{timestamp}.pdf
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

-- Create policy: Admins can view all files (for admin panel)
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

-- Create policy: Admins can update all files
CREATE POLICY "Admins can update all solicitacoes"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'editais');

-- Verificar políticas criadas
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%solicitacoes%'
ORDER BY policyname;

