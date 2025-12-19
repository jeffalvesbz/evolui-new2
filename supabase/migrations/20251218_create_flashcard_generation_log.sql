-- Create table to track AI flashcard generation usage
create table if not exists public.flashcard_generation_log (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    count integer not null default 0,
    created_at timestamptz not null default now(),
    
    constraint flashcard_generation_log_pkey primary key (id)
);

-- Enable RLS
alter table public.flashcard_generation_log enable row level security;

-- Policies
create policy "Users can view their own generation logs"
    on public.flashcard_generation_log
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own generation logs"
    on public.flashcard_generation_log
    for insert
    with check (auth.uid() = user_id);

-- Input indices
create index if not exists flashcard_generation_log_user_id_idx on public.flashcard_generation_log(user_id);
create index if not exists flashcard_generation_log_created_at_idx on public.flashcard_generation_log(created_at);
