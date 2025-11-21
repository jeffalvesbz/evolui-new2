-- Add edital_default_id to solicitacoes_editais to track which edital was created from the request
alter table solicitacoes_editais
add column if not exists edital_default_id uuid references editais_default(id) on delete set null;

-- Create index for faster lookups
create index if not exists idx_solicitacoes_edital_id on solicitacoes_editais(edital_default_id);

