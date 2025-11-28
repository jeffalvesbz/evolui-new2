-- Fix storage policies for editais bucket
-- Run this in the Supabase SQL Editor to fix RLS policies

-- Drop existing policies if they exist
drop policy if exists "Users can upload own solicitacoes" on storage.objects;
drop policy if exists "Users can view own solicitacoes" on storage.objects;
drop policy if exists "Admins can view all solicitacoes" on storage.objects;
drop policy if exists "Users can delete own solicitacoes" on storage.objects;
drop policy if exists "Admins can update all solicitacoes" on storage.objects;

-- Create policy: Users can upload their own files
-- Path format: solicitacoes-editais/{user_id}/{timestamp}.pdf
create policy "Users can upload own solicitacoes"
  on storage.objects
  for insert
  with check (
    bucket_id = 'editais' 
    and split_part(name, '/', 2) = auth.uid()::text
  );

-- Create policy: Users can view their own files
create policy "Users can view own solicitacoes"
  on storage.objects
  for select
  using (
    bucket_id = 'editais' 
    and split_part(name, '/', 2) = auth.uid()::text
  );

-- Create policy: Admins can view all files (for admin panel)
create policy "Admins can view all solicitacoes"
  on storage.objects
  for select
  using (bucket_id = 'editais');

-- Create policy: Users can delete their own files
create policy "Users can delete own solicitacoes"
  on storage.objects
  for delete
  using (
    bucket_id = 'editais' 
    and split_part(name, '/', 2) = auth.uid()::text
  );

-- Create policy: Admins can update all files
create policy "Admins can update all solicitacoes"
  on storage.objects
  for update
  using (bucket_id = 'editais');



