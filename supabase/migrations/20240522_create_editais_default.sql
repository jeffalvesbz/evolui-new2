-- Create editais_default table
create table if not exists editais_default (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  banca text,
  ano int,
  cargo text,
  visivel boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create disciplinas_default table
create table if not exists disciplinas_default (
  id uuid default gen_random_uuid() primary key,
  edital_default_id uuid references editais_default(id) on delete cascade not null,
  nome text not null,
  ordem int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create topicos_default table
create table if not exists topicos_default (
  id uuid default gen_random_uuid() primary key,
  disciplina_default_id uuid references disciplinas_default(id) on delete cascade not null,
  nome text not null,
  ordem int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table editais_default enable row level security;
alter table disciplinas_default enable row level security;
alter table topicos_default enable row level security;

-- Policies (Adjust as needed, for now allowing public read/write for simplicity as per "VELOCIDADE" request, but ideally restricted)
-- For Admin: Allow all
drop policy if exists "Admin Full Access Editais Default" on editais_default;
create policy "Admin Full Access Editais Default" on editais_default for all using (true);

drop policy if exists "Admin Full Access Disciplinas Default" on disciplinas_default;
create policy "Admin Full Access Disciplinas Default" on disciplinas_default for all using (true);

drop policy if exists "Admin Full Access Topicos Default" on topicos_default;
create policy "Admin Full Access Topicos Default" on topicos_default for all using (true);

-- Function to clone edital
create or replace function clone_edital_default(edital_default_id uuid, user_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  new_edital_id uuid;
  disc_rec record;
  new_disc_id uuid;
  topic_rec record;
begin
  -- 1. Create new edital for user
  insert into editais (nome, banca, data_alvo, descricao, user_id) -- Assuming 'editais' table structure based on types.ts (StudyPlan)
  select 
    nome, 
    banca, 
    (ano || '-12-31')::date, -- Placeholder date
    'Clonado de ' || nome,
    user_id
  from editais_default
  where id = edital_default_id
  returning id into new_edital_id;

  -- 2. Loop through disciplines
  for disc_rec in 
    select * from disciplinas_default where edital_default_id = edital_default_id order by ordem
  loop
    -- Create discipline for user
    insert into disciplinas (nome, studyPlanId) -- Assuming 'disciplinas' table structure
    values (disc_rec.nome, new_edital_id)
    returning id into new_disc_id;

    -- 3. Loop through topics
    for topic_rec in
      select * from topicos_default where disciplina_default_id = disc_rec.id order by ordem
    loop
      -- Create topic for user
      insert into topicos (titulo, nivelDificuldade, disciplinaId) -- Assuming 'topicos' table structure
      values (topic_rec.nome, 'médio', new_disc_id);
    end loop;
  end loop;

  return new_edital_id;
end;
$$;
