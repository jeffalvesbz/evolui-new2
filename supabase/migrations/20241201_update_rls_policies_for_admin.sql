-- Update RLS policies to check for admin status
-- This migration updates the RLS policies to properly check if a user is an admin
-- Only users with is_admin = true in their profile should be able to access admin functions

-- ============================================
-- 1. UPDATE POLICIES FOR editais_default
-- ============================================
-- Drop existing policy
drop policy if exists "Admin Full Access Editais Default" on editais_default;

-- Create new policy that checks is_admin
create policy "Admin Full Access Editais Default"
  on editais_default
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ============================================
-- 2. UPDATE POLICIES FOR disciplinas_default
-- ============================================
drop policy if exists "Admin Full Access Disciplinas Default" on disciplinas_default;

create policy "Admin Full Access Disciplinas Default"
  on disciplinas_default
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ============================================
-- 3. UPDATE POLICIES FOR topicos_default
-- ============================================
drop policy if exists "Admin Full Access Topicos Default" on topicos_default;

create policy "Admin Full Access Topicos Default"
  on topicos_default
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ============================================
-- 4. UPDATE POLICIES FOR solicitacoes_editais
-- ============================================
-- Update admin policies to check is_admin
drop policy if exists "Admins can view all solicitacoes" on solicitacoes_editais;
drop policy if exists "Admins can update all solicitacoes" on solicitacoes_editais;
drop policy if exists "Admins can delete all solicitacoes" on solicitacoes_editais;

-- Create policies that check is_admin
create policy "Admins can view all solicitacoes"
  on solicitacoes_editais
  for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update all solicitacoes"
  on solicitacoes_editais
  for update
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can delete all solicitacoes"
  on solicitacoes_editais
  for delete
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

-- ============================================
-- 5. UPDATE STORAGE POLICIES FOR editais BUCKET
-- ============================================
-- Update admin policies for storage
drop policy if exists "Admins can view all solicitacoes" on storage.objects;
drop policy if exists "Admins can update all solicitacoes" on storage.objects;

-- Create policies that check is_admin
create policy "Admins can view all solicitacoes"
  on storage.objects
  for select
  using (
    bucket_id = 'editais'
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

create policy "Admins can update all solicitacoes"
  on storage.objects
  for update
  using (
    bucket_id = 'editais'
    and exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.is_admin = true
    )
  );

