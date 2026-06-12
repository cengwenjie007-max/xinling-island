create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'listener', 'admin');
create type public.profile_status as enum ('active', 'paused', 'disabled');
create type public.consult_status as enum ('new', 'assigned', 'contacted', 'completed', 'unreachable', 'closed');
create type public.assignment_status as enum ('assigned', 'contacted', 'completed', 'unreachable');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nickname text,
  avatar_url text,
  role public.user_role not null default 'user',
  status public.profile_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  title text,
  specialties text[] not null default '{}',
  credential_note text,
  bio text,
  accepting boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mood_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mood text not null,
  energy int not null check (energy between 1 and 10),
  note text,
  created_at timestamptz not null default now()
);

create table public.test_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  test_id text not null,
  test_name text not null,
  score numeric not null,
  max_score numeric not null,
  result_title text,
  risk_flag boolean not null default false,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.sprite_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  safety text not null default 'normal',
  created_at timestamptz not null default now()
);

create table public.drift_bottles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  islander_no bigint generated always as identity,
  content text not null,
  mood text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'hidden')),
  risk_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.mood_wall_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  islander_no bigint generated always as identity,
  mood text not null,
  content text not null,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'hidden')),
  risk_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.island_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  islander_no bigint generated always as identity,
  content text not null,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  moderation_status text not null default 'approved' check (moderation_status in ('pending', 'approved', 'hidden')),
  risk_flag boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.consult_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  service_type text not null,
  topic text not null,
  summary text,
  risk_flag boolean not null default false,
  source text not null default 'site',
  test_session_id uuid references public.test_sessions(id) on delete set null,
  status public.consult_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  consult_request_id uuid not null references public.consult_requests(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  status public.assignment_status not null default 'assigned',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (consult_request_id, provider_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index mood_entries_user_created_idx on public.mood_entries(user_id, created_at desc);
create index test_sessions_user_created_idx on public.test_sessions(user_id, created_at desc);
create index sprite_chats_user_created_idx on public.sprite_chats(user_id, created_at desc);
create index drift_bottles_public_created_idx on public.drift_bottles(visibility, moderation_status, created_at desc);
create index mood_wall_posts_public_created_idx on public.mood_wall_posts(visibility, moderation_status, risk_flag, created_at desc);
create index mood_wall_posts_user_created_idx on public.mood_wall_posts(user_id, created_at desc);
create index island_logs_public_created_idx on public.island_logs(visibility, moderation_status, created_at desc);
create index consult_requests_status_created_idx on public.consult_requests(status, created_at desc);
create index assignments_provider_status_idx on public.assignments(provider_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger providers_updated_at before update on public.providers
for each row execute function public.set_updated_at();
create trigger consult_requests_updated_at before update on public.consult_requests
for each row execute function public.set_updated_at();
create trigger assignments_updated_at before update on public.assignments
for each row execute function public.set_updated_at();

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles.';
  end if;
  if auth.uid() is not null and old.status is distinct from new.status and not public.is_admin() then
    raise exception 'Only admins can change profile status.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_listener()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('listener', 'admin') and status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.mood_entries enable row level security;
alter table public.test_sessions enable row level security;
alter table public.sprite_chats enable row level security;
alter table public.drift_bottles enable row level security;
alter table public.mood_wall_posts enable row level security;
alter table public.island_logs enable row level security;
alter table public.consult_requests enable row level security;
alter table public.assignments enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles read own or admin" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "profiles update own basic" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin all" on public.profiles
for all using (public.is_admin()) with check (public.is_admin());

create policy "providers public read accepting" on public.providers
for select using (accepting = true or public.is_admin() or profile_id = auth.uid());
create policy "providers owner update" on public.providers
for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "providers admin all" on public.providers
for all using (public.is_admin()) with check (public.is_admin());

create policy "moods owner all" on public.mood_entries
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "moods admin read" on public.mood_entries
for select using (public.is_admin());

create policy "tests owner all" on public.test_sessions
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tests admin read" on public.test_sessions
for select using (public.is_admin());

create policy "sprite owner all" on public.sprite_chats
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "sprite admin read" on public.sprite_chats
for select using (public.is_admin());

create policy "bottles public approved read" on public.drift_bottles
for select using (visibility = 'public' and moderation_status = 'approved' and risk_flag = false);
create policy "bottles owner insert" on public.drift_bottles
for insert with check (user_id = auth.uid() or user_id is null);
create policy "bottles owner read" on public.drift_bottles
for select using (user_id = auth.uid());
create policy "bottles admin all" on public.drift_bottles
for all using (public.is_admin()) with check (public.is_admin());

create policy "mood wall public approved read" on public.mood_wall_posts
for select using (visibility = 'public' and moderation_status = 'approved' and risk_flag = false);
create policy "mood wall owner insert" on public.mood_wall_posts
for insert with check (user_id = auth.uid());
create policy "mood wall owner read" on public.mood_wall_posts
for select using (user_id = auth.uid());
create policy "mood wall admin all" on public.mood_wall_posts
for all using (public.is_admin()) with check (public.is_admin());

create policy "logs public approved read" on public.island_logs
for select using (visibility = 'public' and moderation_status = 'approved' and risk_flag = false);
create policy "logs owner insert" on public.island_logs
for insert with check (user_id = auth.uid() or user_id is null);
create policy "logs owner read" on public.island_logs
for select using (user_id = auth.uid());
create policy "logs admin all" on public.island_logs
for all using (public.is_admin()) with check (public.is_admin());

create policy "consult owner insert read" on public.consult_requests
for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "consult admin all" on public.consult_requests
for all using (public.is_admin()) with check (public.is_admin());
create policy "consult listener assigned read" on public.consult_requests
for select using (
  public.is_listener() and exists (
    select 1 from public.assignments a
    join public.providers p on p.id = a.provider_id
    where a.consult_request_id = consult_requests.id and p.profile_id = auth.uid()
  )
);

create policy "assignments admin all" on public.assignments
for all using (public.is_admin()) with check (public.is_admin());
create policy "assignments provider read update" on public.assignments
for select using (
  exists (select 1 from public.providers p where p.id = provider_id and p.profile_id = auth.uid())
);
create policy "assignments provider status update" on public.assignments
for update using (
  exists (select 1 from public.providers p where p.id = provider_id and p.profile_id = auth.uid())
) with check (
  exists (select 1 from public.providers p where p.id = provider_id and p.profile_id = auth.uid())
);

create policy "audit admin read" on public.audit_logs
for select using (public.is_admin());
create policy "audit admin insert" on public.audit_logs
for insert with check (public.is_admin());
