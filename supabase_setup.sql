-- =========================================
-- GROWTH BRIDGE RPG ACADEMY
-- BASIC DATABASE SETUP
-- =========================================

create extension if not exists pgcrypto;

-- STUDENT PROFILES

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  class_name text,
  school_name text,
  syllabus text,
  subjects text,
  gender text,
  created_at timestamptz default now()
);

-- MISSIONS

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);

-- REWARD BALANCES

create table if not exists public.reward_balances (
  student_id uuid primary key references auth.users(id) on delete cascade,
  gp integer default 0,
  xp integer default 0,
  coins integer default 0,
  gb_points integer default 0,
  updated_at timestamptz default now()
);

-- AUTOMATIC PROFILE CREATION

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    username,
    class_name,
    school_name,
    syllabus,
    subjects,
    gender
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'class_name',
    new.raw_user_meta_data ->> 'school_name',
    new.raw_user_meta_data ->> 'syllabus',
    new.raw_user_meta_data ->> 'subjects',
    new.raw_user_meta_data ->> 'gender'
  )
  on conflict (id) do nothing;

  insert into public.reward_balances (student_id)
  values (new.id)
  on conflict (student_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- ENABLE ROW LEVEL SECURITY

alter table public.profiles enable row level security;
alter table public.missions enable row level security;
alter table public.reward_balances enable row level security;

-- PROFILE POLICIES

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- MISSION POLICIES

drop policy if exists "Users can view own missions" on public.missions;
create policy "Users can view own missions"
on public.missions for select
to authenticated
using (auth.uid() = student_id);

drop policy if exists "Users can add own missions" on public.missions;
create policy "Users can add own missions"
on public.missions for insert
to authenticated
with check (auth.uid() = student_id);

drop policy if exists "Users can update own missions" on public.missions;
create policy "Users can update own missions"
on public.missions for update
to authenticated
using (auth.uid() = student_id)
with check (auth.uid() = student_id);

drop policy if exists "Users can delete own missions" on public.missions;
create policy "Users can delete own missions"
on public.missions for delete
to authenticated
using (auth.uid() = student_id);

-- REWARD POLICIES

drop policy if exists "Users can view own reward balance" on public.reward_balances;
create policy "Users can view own reward balance"
on public.reward_balances for select
to authenticated
using (auth.uid() = student_id);

-- Students cannot directly edit their reward balances.
-- Trusted server-side functions should handle reward changes.
