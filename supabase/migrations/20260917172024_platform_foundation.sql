create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 100),
  username text null check (username is null or username ~ '^[A-Za-z0-9_]{3,32}$'),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('github', 'google_calendar', 'linear', 'notion', 'toggl', 'browser_extension')),
  provider_account_id text null,
  provider_account_name text null,
  status text not null default 'connecting' check (status in ('not_connected', 'connecting', 'connected', 'syncing', 'error', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz null,
  sync_cursor text null,
  sync_error text null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, provider, provider_account_id)
);

comment on column public.connections.metadata is
  'Non-secret provider metadata only. OAuth tokens and provider secrets must remain in server-managed secret storage.';

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid null,
  source text not null check (source in ('manual', 'csv', 'json', 'github', 'google_calendar', 'linear', 'notion', 'toggl', 'browser_extension')),
  external_id text null,
  type text not null default 'activity' check (char_length(trim(type)) between 1 and 100),
  title text not null check (char_length(trim(title)) between 1 and 500),
  description text null,
  date date not null,
  occurred_at timestamptz null,
  has_observed_time boolean not null default false,
  category text not null check (category in ('coding', 'ai-ml', 'finance', 'filmmaking', 'reading', 'learning', 'social', 'projects')),
  topics text[] not null default '{}',
  project text null,
  duration_minutes integer null check (duration_minutes is null or duration_minutes >= 0),
  url text null check (url is null or url ~* '^https?://'),
  source_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(source_metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint activities_observed_time_consistent check (
    (has_observed_time and occurred_at is not null)
    or (not has_observed_time and occurred_at is null)
  ),
  constraint activities_connection_owner_fk foreign key (connection_id, user_id)
    references public.connections(id, user_id) on delete set null (connection_id),
  constraint activities_external_record_unique unique (user_id, source, external_id)
);

comment on constraint activities_external_record_unique on public.activities is
  'Postgres permits multiple NULL external IDs, so manual activities remain unconstrained. Adapters must namespace provider IDs when they are only account-scoped.';

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  status text not null check (status in ('running', 'succeeded', 'failed', 'partial')),
  records_created integer not null default 0 check (records_created >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  records_skipped integer not null default 0 check (records_skipped >= 0),
  error_message text null,
  created_at timestamptz not null default now(),
  constraint sync_runs_connection_owner_fk foreign key (connection_id, user_id)
    references public.connections(id, user_id) on delete cascade
);

create index activities_user_date_idx on public.activities(user_id, date desc);
create index activities_user_connection_idx on public.activities(user_id, connection_id);
create index connections_user_provider_idx on public.connections(user_id, provider);
create index sync_runs_user_connection_started_idx on public.sync_runs(user_id, connection_id, started_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger connections_set_updated_at before update on public.connections
for each row execute function public.set_updated_at();
create trigger activities_set_updated_at before update on public.activities
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.activities enable row level security;
alter table public.sync_runs enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.connections from anon, authenticated;
revoke all on table public.activities from anon, authenticated;
revoke all on table public.sync_runs from anon, authenticated;
revoke all on table public.profiles from public;
revoke all on table public.connections from public;
revoke all on table public.activities from public;
revoke all on table public.sync_runs from public;
revoke all on function public.set_updated_at() from public;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.connections to authenticated;
grant select, insert, update, delete on table public.activities to authenticated;
grant select, insert, update, delete on table public.sync_runs to authenticated;

create policy "profiles_select_own" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles
for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles
for delete to authenticated using ((select auth.uid()) = id);

create policy "connections_select_own" on public.connections
for select to authenticated using ((select auth.uid()) = user_id);
create policy "connections_insert_own" on public.connections
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "connections_update_own" on public.connections
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "connections_delete_own" on public.connections
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "activities_select_own" on public.activities
for select to authenticated using ((select auth.uid()) = user_id);
create policy "activities_insert_own" on public.activities
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "activities_update_own" on public.activities
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "activities_delete_own" on public.activities
for delete to authenticated using ((select auth.uid()) = user_id);

create policy "sync_runs_select_own" on public.sync_runs
for select to authenticated using ((select auth.uid()) = user_id);
create policy "sync_runs_insert_own" on public.sync_runs
for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "sync_runs_update_own" on public.sync_runs
for update to authenticated using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "sync_runs_delete_own" on public.sync_runs
for delete to authenticated using ((select auth.uid()) = user_id);
