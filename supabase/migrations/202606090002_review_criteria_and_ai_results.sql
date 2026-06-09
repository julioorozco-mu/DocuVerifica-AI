-- Migración: Crear tipos ENUM, tablas review_criteria y ai_review_results
-- Estas tablas corresponden a las Fases 4 y 5 del proyecto.

-- ──────────────────────────────────────────────────────────────────────────
-- 1. Tipos ENUM
-- ──────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'criterion_rule_type') then
    create type public.criterion_rule_type as enum (
      'rule',
      'semantic',
      'ai',
      'rule_then_ai'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'ai_review_status') then
    create type public.ai_review_status as enum (
      'cumple',
      'no_cumple',
      'no_encontrado',
      'requiere_revision'
    );
  end if;
end $$;

-- ──────────────────────────────────────────────────────────────────────────
-- 2. Tabla review_criteria
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.review_criteria (
  id            uuid primary key default gen_random_uuid(),
  name          varchar(255) not null,
  description   text,
  rule_type     public.criterion_rule_type not null default 'ai',
  is_active     boolean not null default true,
  -- null = criterio global; UUID = criterio personal del revisor
  reviewer_id   uuid references public.profiles(id) on delete cascade,
  -- Agrupa criterios por tipo de proyecto (ej. "Microcredencial", "Diplomado")
  project_type  varchar(100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Índices
create index if not exists idx_review_criteria_is_active    on public.review_criteria (is_active);
create index if not exists idx_review_criteria_rule_type    on public.review_criteria (rule_type);
create index if not exists idx_review_criteria_reviewer_id  on public.review_criteria (reviewer_id);
create index if not exists idx_review_criteria_project_type on public.review_criteria (project_type);

-- Trigger updated_at
drop trigger if exists set_review_criteria_updated_at on public.review_criteria;
create trigger set_review_criteria_updated_at
before update on public.review_criteria
for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- 3. Tabla ai_review_results
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.ai_review_results (
  id                    uuid primary key default gen_random_uuid(),
  document_id           uuid not null references public.documents(id) on delete cascade,
  criterion_id          uuid not null references public.review_criteria(id) on delete cascade,
  status                public.ai_review_status not null,
  confidence            float not null default 0.0,
  evidence              text,
  page_number           integer,
  explanation           text,
  human_action_required boolean not null default false,
  created_at            timestamptz not null default now()
);

-- Índices
create index if not exists idx_ai_review_results_document_id  on public.ai_review_results (document_id);
create index if not exists idx_ai_review_results_criterion_id on public.ai_review_results (criterion_id);
create index if not exists idx_ai_review_results_status       on public.ai_review_results (status);

-- ──────────────────────────────────────────────────────────────────────────
-- 4. Grants para el rol authenticated
-- ──────────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.review_criteria  to authenticated;
grant select, insert, update, delete on public.ai_review_results to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ──────────────────────────────────────────────────────────────────────────
alter table public.review_criteria  enable row level security;
alter table public.ai_review_results enable row level security;

-- review_criteria: cualquier usuario autenticado puede ver criterios activos;
--                  solo admins pueden crear/editar/borrar.
drop policy if exists criteria_select_authenticated on public.review_criteria;
create policy criteria_select_authenticated
  on public.review_criteria for select
  to authenticated
  using (true);

drop policy if exists criteria_insert_admin on public.review_criteria;
create policy criteria_insert_admin
  on public.review_criteria for insert
  to authenticated
  with check (public.current_profile_role() = 'admin');

drop policy if exists criteria_update_admin on public.review_criteria;
create policy criteria_update_admin
  on public.review_criteria for update
  to authenticated
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

drop policy if exists criteria_delete_admin on public.review_criteria;
create policy criteria_delete_admin
  on public.review_criteria for delete
  to authenticated
  using (public.current_profile_role() = 'admin');

-- ai_review_results: visible para el dueño del documento o admin.
drop policy if exists ai_results_select_owned_or_admin on public.ai_review_results;
create policy ai_results_select_owned_or_admin
  on public.ai_review_results for select
  to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = ai_review_results.document_id
        and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
    )
  );

drop policy if exists ai_results_insert_owned_or_admin on public.ai_review_results;
create policy ai_results_insert_owned_or_admin
  on public.ai_review_results for insert
  to authenticated
  with check (
    exists (
      select 1 from public.documents d
      where d.id = ai_review_results.document_id
        and (d.user_id = (select auth.uid()) or public.current_profile_role() = 'admin')
    )
  );
