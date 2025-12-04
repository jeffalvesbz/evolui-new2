-- Create solicitacoes_editais table
create table if not exists solicitacoes_editais (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome_edital text not null,
  banca text,
  cargo text,
  ano int,
  link_edital text,
  arquivo_pdf_url text,
  observacoes text,
  status text default 'pendente' check (status in ('pendente', 'em_analise', 'aprovado', 'rejeitado')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table solicitacoes_editais enable row level security;

-- Drop existing policies if they exist (para permitir re-execução)
drop policy if exists "Users can insert own solicitacoes" on solicitacoes_editais;
drop policy if exists "Users can view own solicitacoes" on solicitacoes_editais;
drop policy if exists "Admins can view all solicitacoes" on solicitacoes_editais;
drop policy if exists "Admins can update all solicitacoes" on solicitacoes_editais;
drop policy if exists "Admins can delete all solicitacoes" on solicitacoes_editais;
drop policy if exists "Users can delete own solicitacoes" on solicitacoes_editais;

-- Policy: Users can insert their own requests
create policy "Users can insert own solicitacoes"
  on solicitacoes_editais
  for insert
  with check (auth.uid() = user_id);

-- Policy: Users can view their own requests
create policy "Users can view own solicitacoes"
  on solicitacoes_editais
  for select
  using (auth.uid() = user_id);

-- Policy: Admins can view all requests
create policy "Admins can view all solicitacoes"
  on solicitacoes_editais
  for select
  using (true);

-- Policy: Admins can update all requests
create policy "Admins can update all solicitacoes"
  on solicitacoes_editais
  for update
  using (true);

-- Policy: Admins can delete all requests
create policy "Admins can delete all solicitacoes"
  on solicitacoes_editais
  for delete
  using (true);

-- Policy: Users can delete their own requests
create policy "Users can delete own solicitacoes"
  on solicitacoes_editais
  for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists idx_solicitacoes_user_id on solicitacoes_editais(user_id);
create index if not exists idx_solicitacoes_status on solicitacoes_editais(status);
create index if not exists idx_solicitacoes_created_at on solicitacoes_editais(created_at desc);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_solicitacoes_updated_at
  before update on solicitacoes_editais
  for each row
  execute function update_updated_at_column();

