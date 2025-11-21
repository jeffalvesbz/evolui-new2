-- Add is_admin field to profiles table
-- This migration adds an is_admin boolean field to the profiles table
-- Only users with is_admin = true should be able to access admin routes

alter table profiles 
add column if not exists is_admin boolean default false not null;

-- Create index for faster admin checks
create index if not exists idx_profiles_is_admin on profiles(is_admin) where is_admin = true;

-- Comment
comment on column profiles.is_admin is 'Indica se o usuário tem permissões de administrador';

