create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  mode text not null check (mode in ('standard', 'true_false')),
  questions jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table quizzes enable row level security;

create policy "Users can view their own quizzes"
  on quizzes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own quizzes"
  on quizzes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own quizzes"
  on quizzes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own quizzes"
  on quizzes for delete
  using (auth.uid() = user_id);
