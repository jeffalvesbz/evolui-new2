-- Add data_prova column to editais_default table
alter table if exists public.editais_default
add column if not exists data_prova date;

-- Comment on column
comment on column editais_default.data_prova is 'Data prevista da prova do concurso';
