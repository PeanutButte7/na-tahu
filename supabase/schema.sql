create extension if not exists "pgcrypto";

create table if not exists packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price_display text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references packs(id) on delete cascade,
  prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists question_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  answer_text text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique (question_id, answer_text)
);

create or replace function enforce_min_answer_counts()
returns trigger
language plpgsql
as $$
declare
  target_question_id uuid;
  correct_count int;
  wrong_count int;
begin
  target_question_id := coalesce(new.question_id, old.question_id);

  if not exists (select 1 from questions where id = target_question_id) then
    return null;
  end if;

  select
    count(*) filter (where is_correct),
    count(*) filter (where not is_correct)
  into correct_count, wrong_count
  from question_answers
  where question_id = target_question_id;

  if correct_count < 5 or wrong_count < 5 then
    raise exception 'Each question must have at least 5 correct and 5 wrong answers. Correct: %, Wrong: %',
      correct_count, wrong_count;
  end if;

  return null;
end;
$$;

drop trigger if exists enforce_min_answer_counts on question_answers;
create constraint trigger enforce_min_answer_counts
after insert or update or delete on question_answers
deferrable initially deferred
for each row execute function enforce_min_answer_counts();

alter table packs enable row level security;
alter table questions enable row level security;
alter table question_answers enable row level security;

drop policy if exists "packs are readable when active" on packs;
create policy "packs are readable when active"
on packs for select
using (is_active = true);

drop policy if exists "questions are readable for active packs" on questions;
create policy "questions are readable for active packs"
on questions for select
using (
  exists (
    select 1 from packs
    where packs.id = questions.pack_id
      and packs.is_active = true
  )
);

drop policy if exists "answers are readable for active packs" on question_answers;
create policy "answers are readable for active packs"
on question_answers for select
using (
  exists (
    select 1
    from questions
    join packs on packs.id = questions.pack_id
    where questions.id = question_answers.question_id
      and packs.is_active = true
  )
);
