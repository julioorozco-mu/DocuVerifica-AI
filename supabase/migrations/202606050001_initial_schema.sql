create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('admin', 'revisor');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum (
      'uploaded',
      'extracting_text',
      'ocr_required',
      'ocr_processing',
      'processing',
      'ready_for_review',
      'ai_reviewing',
      'ai_review_done',
      'human_review_done',
      'error'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'human_verdict_status') then
    create type public.human_verdict_status as enum (
      'cumple',
      'no_cumple',
      'no_encontrado',
      'requiere_revision'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) not null unique,
  full_name varchar(255) not null,
  role public.user_role not null default 'revisor',
  hashed_password varchar(255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  filename varchar(255) not null,
  file_path varchar(512) not null,
  size_bytes bigint not null,
  status public.document_status not null default 'uploaded',
  user_id uuid references public.profiles(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.human_verdicts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null unique references public.documents(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  status public.human_verdict_status not null,
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action varchar(100) not null,
  user_id uuid references public.profiles(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  section_heading text,
  headings jsonb not null default '[]'::jsonb,
  page_start integer,
  page_end integer,
  word_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint document_chunks_document_id_chunk_index_key unique (document_id, chunk_index)
);

create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_status_idx on public.documents (status);
create index if not exists documents_created_at_idx on public.documents (created_at desc);
create index if not exists human_verdicts_document_id_idx on public.human_verdicts (document_id);
create index if not exists human_verdicts_reviewer_id_idx on public.human_verdicts (reviewer_id);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);
create index if not exists audit_logs_action_idx on public.audit_logs (action);
create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists document_chunks_document_id_idx on public.document_chunks (document_id);
create index if not exists document_chunks_page_start_idx on public.document_chunks (page_start);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.human_verdicts to authenticated;
grant select, insert on public.audit_logs to authenticated;
grant select, insert, update, delete on public.document_chunks to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_documents_updated_at on public.documents;
create trigger set_documents_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists set_human_verdicts_updated_at on public.human_verdicts;
create trigger set_human_verdicts_updated_at
before update on public.human_verdicts
for each row execute function public.set_updated_at();

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text
  from public.profiles
  where id = (select auth.uid())
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_role text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'revisor');

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when requested_role in ('admin', 'revisor') then requested_role::public.user_role else 'revisor'::public.user_role end
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.documents enable row level security;
alter table public.human_verdicts enable row level security;
alter table public.audit_logs enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (id = (select auth.uid()) or public.current_profile_role() = 'admin')
with check (id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists documents_select_owned_or_admin on public.documents;
create policy documents_select_owned_or_admin
on public.documents
for select
to authenticated
using (user_id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists documents_insert_owned_or_admin on public.documents;
create policy documents_insert_owned_or_admin
on public.documents
for insert
to authenticated
with check (user_id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists documents_update_owned_or_admin on public.documents;
create policy documents_update_owned_or_admin
on public.documents
for update
to authenticated
using (user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
with check (user_id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists human_verdicts_select_owned_or_admin on public.human_verdicts;
create policy human_verdicts_select_owned_or_admin
on public.human_verdicts
for select
to authenticated
using (
  reviewer_id = (select auth.uid())
  or public.current_profile_role() = 'admin'
  or exists (
    select 1
    from public.documents d
    where d.id = human_verdicts.document_id
      and d.user_id = (select auth.uid())
  )
);

drop policy if exists human_verdicts_insert_reviewer_or_admin on public.human_verdicts;
create policy human_verdicts_insert_reviewer_or_admin
on public.human_verdicts
for insert
to authenticated
with check (reviewer_id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists human_verdicts_update_reviewer_or_admin on public.human_verdicts;
create policy human_verdicts_update_reviewer_or_admin
on public.human_verdicts
for update
to authenticated
using (reviewer_id = (select auth.uid()) or public.current_profile_role() = 'admin')
with check (reviewer_id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs
for select
to authenticated
using (public.current_profile_role() = 'admin');

drop policy if exists audit_logs_insert_self_or_admin on public.audit_logs;
create policy audit_logs_insert_self_or_admin
on public.audit_logs
for insert
to authenticated
with check (user_id = (select auth.uid()) or public.current_profile_role() = 'admin');

drop policy if exists document_chunks_select_owned_or_admin on public.document_chunks;
create policy document_chunks_select_owned_or_admin
on public.document_chunks
for select
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_chunks.document_id
      and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
  )
);

drop policy if exists document_chunks_insert_owned_or_admin on public.document_chunks;
create policy document_chunks_insert_owned_or_admin
on public.document_chunks
for insert
to authenticated
with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_chunks.document_id
      and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
  )
);

drop policy if exists document_chunks_update_owned_or_admin on public.document_chunks;
create policy document_chunks_update_owned_or_admin
on public.document_chunks
for update
to authenticated
using (
  exists (
    select 1
    from public.documents d
    where d.id = document_chunks.document_id
      and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
  )
)
with check (
  exists (
    select 1
    from public.documents d
    where d.id = document_chunks.document_id
      and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
  )
);
