do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_priority') then
    create type public.document_priority as enum ('baja', 'media', 'alta');
  end if;
end $$;

alter table public.documents
  add column if not exists priority public.document_priority not null default 'media';

create table if not exists public.document_processing_requests (
  document_id uuid primary key references public.documents(id) on delete cascade,
  requested_ai boolean not null default false,
  model_name varchar(100),
  selected_criterion_ids jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_priority on public.documents(priority);
create index if not exists idx_document_processing_requests_requested_ai
  on public.document_processing_requests(requested_ai);

drop trigger if exists set_document_processing_requests_updated_at on public.document_processing_requests;
create trigger set_document_processing_requests_updated_at
before update on public.document_processing_requests
for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.document_processing_requests to authenticated;

alter table public.document_processing_requests enable row level security;

drop policy if exists processing_requests_owned_or_admin on public.document_processing_requests;
create policy processing_requests_owned_or_admin
  on public.document_processing_requests for all
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_processing_requests.document_id
        and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_processing_requests.document_id
        and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
    )
  );
