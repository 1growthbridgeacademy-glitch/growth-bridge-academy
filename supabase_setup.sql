-- GROWTH BRIDGE RPG ACADEMY
-- Starter database schema.
-- Run in Supabase Dashboard -> SQL Editor -> New query.
-- IMPORTANT: this is a starter schema, not a complete production backend.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text,
  class_name text,
  syllabus text,
  school_name text,
  gender text check (gender in ('Male', 'Female')),
  subjects text[] default '{}',
  working_schedule text,
  holiday_schedule text,
  role text not null default 'student'
    check (role in ('student', 'teacher', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    'student_' || substr(new.id::text, 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_student_profile();

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  class_name text not null,
  syllabus text not null,
  school_name text not null,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.class_memberships (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  approved boolean not null default false,
  created_at timestamptz default now(),
  unique (class_id, student_id)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  subject_name text not null unique
);

create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  unique (class_id, subject_id)
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  title text not null,
  description text,
  gp_reward integer not null default 0 check (gp_reward >= 0),
  assigned_by uuid references public.profiles(id),
  due_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.mission_completions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz default now(),
  status text not null default 'completed'
    check (status in ('completed', 'reviewed')),
  unique (mission_id, student_id)
);

create table if not exists public.activity_tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_name text not null,
  category text not null check (category in ('personal', 'exercise')),
  active boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists public.activity_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.activity_tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed_on date not null default current_date,
  gp_awarded integer not null default 0 check (gp_awarded >= 0),
  unique (task_id, completed_on)
);

create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  progress_date date not null default current_date,
  gp_earned integer not null default 0 check (gp_earned >= 0),
  study_minutes integer not null default 0 check (study_minutes >= 0),
  completed_tasks integer not null default 0 check (completed_tasks >= 0),
  target_gp integer not null default 100 check (target_gp >= 0),
  unique (student_id, progress_date)
);

create table if not exists public.reward_balances (
  student_id uuid primary key references public.profiles(id) on delete cascade,
  xp bigint not null default 0 check (xp >= 0),
  coins bigint not null default 0 check (coins >= 0),
  gb_points bigint not null default 0 check (gb_points >= 0),
  lifetime_gp bigint not null default 0 check (lifetime_gp >= 0)
);

create table if not exists public.reward_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  reward_type text not null check (reward_type in ('xp', 'coins', 'gb_points', 'gp')),
  amount bigint not null,
  reason text not null,
  reference_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  character_name text not null unique,
  gender text not null check (gender in ('Male', 'Female')),
  required_lifetime_xp integer not null default 0,
  coin_price integer not null default 0,
  image_path text,
  active boolean not null default true
);

create table if not exists public.student_characters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  character_id uuid not null references public.characters(id),
  unlocked_at timestamptz default now(),
  selected boolean not null default false,
  unique (student_id, character_id)
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  achievement_name text not null unique,
  description text,
  image_path text,
  requirement text
);

create table if not exists public.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id),
  awarded_at timestamptz default now(),
  unique (student_id, achievement_id)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  class_id uuid references public.classes(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  approved_by_teacher boolean not null default false,
  joined_at timestamptz default now(),
  unique (team_id, student_id)
);

create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  room_name text not null,
  created_at timestamptz default now()
);

create table if not exists public.chat_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  approved boolean not null default false,
  unique (room_id, student_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message_text text,
  attachment_path text,
  created_at timestamptz default now(),
  check (
    coalesce(length(trim(message_text)), 0) > 0
    or attachment_path is not null
  )
);

create table if not exists public.ambassador_announcements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  announcement_type text not null
    check (announcement_type in ('weekly', 'monthly')),
  announcement_title text not null,
  published_by uuid references public.profiles(id),
  published_at timestamptz default now()
);

-- Enable Row Level Security on all app tables.
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_memberships enable row level security;
alter table public.subjects enable row level security;
alter table public.class_subjects enable row level security;
alter table public.missions enable row level security;
alter table public.mission_completions enable row level security;
alter table public.activity_tasks enable row level security;
alter table public.activity_completions enable row level security;
alter table public.daily_progress enable row level security;
alter table public.reward_balances enable row level security;
alter table public.reward_transactions enable row level security;
alter table public.characters enable row level security;
alter table public.student_characters enable row level security;
alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.chat_rooms enable row level security;
alter table public.chat_room_members enable row level security;
alter table public.chat_messages enable row level security;
alter table public.ambassador_announcements enable row level security;

-- Profiles: users can read their own profile.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
for select to authenticated
using (id = (select auth.uid()));

-- Students cannot change their role.
revoke update on public.profiles from authenticated;

grant update (
  username,
  class_name,
  syllabus,
  school_name,
  gender,
  subjects,
  working_schedule,
  holiday_schedule
) on public.profiles to authenticated;

drop policy if exists "Update own profile fields" on public.profiles;
create policy "Update own profile fields" on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Memberships: users can read their own membership records.
drop policy if exists "Read own memberships" on public.class_memberships;
create policy "Read own memberships" on public.class_memberships
for select to authenticated
using (student_id = (select auth.uid()));

-- Personal activity tasks.
drop policy if exists "Read own activity tasks" on public.activity_tasks;
create policy "Read own activity tasks" on public.activity_tasks
for select to authenticated
using (student_id = (select auth.uid()));

drop policy if exists "Add own activity tasks" on public.activity_tasks;
create policy "Add own activity tasks" on public.activity_tasks
for insert to authenticated
with check (student_id = (select auth.uid()));

drop policy if exists "Update own activity tasks" on public.activity_tasks;
create policy "Update own activity tasks" on public.activity_tasks
for update to authenticated
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));

drop policy if exists "Delete own activity tasks" on public.activity_tasks;
create policy "Delete own activity tasks" on public.activity_tasks
for delete to authenticated
using (student_id = (select auth.uid()));

-- Daily progress: users can read their own records.
drop policy if exists "Read own daily progress" on public.daily_progress;
create policy "Read own daily progress" on public.daily_progress
for select to authenticated
using (student_id = (select auth.uid()));

-- Reward balances and transactions: read only.
drop policy if exists "Read own reward balance" on public.reward_balances;
create policy "Read own reward balance" on public.reward_balances
for select to authenticated
using (student_id = (select auth.uid()));

drop policy if exists "Read own reward transactions" on public.reward_transactions;
create policy "Read own reward transactions" on public.reward_transactions
for select to authenticated
using (student_id = (select auth.uid()));

-- Character catalogue and a student's own characters.
drop policy if exists "Read character catalogue" on public.characters;
create policy "Read character catalogue" on public.characters
for select to authenticated
using (active = true);

drop policy if exists "Read own characters" on public.student_characters;
create policy "Read own characters" on public.student_characters
for select to authenticated
using (student_id = (select auth.uid()));

-- Achievement catalogue and personal achievements.
drop policy if exists "Read achievement catalogue" on public.achievements;
create policy "Read achievement catalogue" on public.achievements
for select to authenticated
using (true);

drop policy if exists "Read own achievements" on public.student_achievements;
create policy "Read own achievements" on public.student_achievements
for select to authenticated
using (student_id = (select auth.uid()));

-- Team membership and team visibility.
drop policy if exists "Read own team memberships" on public.team_members;
create policy "Read own team memberships" on public.team_members
for select to authenticated
using (student_id = (select auth.uid()));

drop policy if exists "Read teams" on public.teams;
create policy "Read teams" on public.teams
for select to authenticated
using (
  exists (
    select 1
    from public.team_members tm
    where tm.team_id = teams.id
      and tm.student_id = (select auth.uid())
  )
);

-- Chat: only approved room members can read rooms and messages.
drop policy if exists "Read approved chat memberships" on public.chat_room_members;
create policy "Read approved chat memberships" on public.chat_room_members
for select to authenticated
using (
  student_id = (select auth.uid())
  and approved = true
);

drop policy if exists "Read approved chat rooms" on public.chat_rooms;
create policy "Read approved chat rooms" on public.chat_rooms
for select to authenticated
using (
  exists (
    select 1
    from public.chat_room_members crm
    where crm.room_id = chat_rooms.id
      and crm.student_id = (select auth.uid())
      and crm.approved = true
  )
);

drop policy if exists "Read messages in approved rooms" on public.chat_messages;
create policy "Read messages in approved rooms" on public.chat_messages
for select to authenticated
using (
  exists (
    select 1
    from public.chat_room_members crm
    where crm.room_id = chat_messages.room_id
      and crm.student_id = (select auth.uid())
      and crm.approved = true
  )
);

drop policy if exists "Send messages in approved rooms" on public.chat_messages;
create policy "Send messages in approved rooms" on public.chat_messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.chat_room_members crm
    where crm.room_id = chat_messages.room_id
      and crm.student_id = (select auth.uid())
      and crm.approved = true
  )
);

-- Students can read published ambassador announcements.
drop policy if exists "Read ambassador announcements" on public.ambassador_announcements;
create policy "Read ambassador announcements" on public.ambassador_announcements
for select to authenticated
using (true);

-- Students can read missions assigned to their approved class.
drop policy if exists "Read class missions" on public.missions;
create policy "Read class missions" on public.missions
for select to authenticated
using (
  exists (
    select 1
    from public.class_memberships cm
    where cm.class_id = missions.class_id
      and cm.student_id = (select auth.uid())
      and cm.approved = true
  )
);

-- Students can read their own mission completion records.
drop policy if exists "Read own mission completions" on public.mission_completions;
create policy "Read own mission completions" on public.mission_completions
for select to authenticated
using (student_id = (select auth.uid()));

-- Students can read their own activity completion records.
drop policy if exists "Read own activity completions" on public.activity_completions;
create policy "Read own activity completions" on public.activity_completions
for select to authenticated
using (student_id = (select auth.uid()));

-- Basic read access for class and subject lists.
drop policy if exists "Read subjects" on public.subjects;
create policy "Read subjects" on public.subjects
for select to authenticated
using (true);

drop policy if exists "Read classes" on public.classes;
create policy "Read classes" on public.classes
for select to authenticated
using (true);

drop policy if exists "Read class subjects" on public.class_subjects;
create policy "Read class subjects" on public.class_subjects
for select to authenticated
using (true);

-- Deliberately no student-side write policies for:
-- reward balances, reward transactions, teacher roles, approvals,
-- teacher missions, or ambassador announcements.
-- Those actions need trusted server-side functions and teacher authorization.
