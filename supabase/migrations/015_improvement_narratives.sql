-- ============================================================
-- 15. IMPROVEMENT NARRATIVES
-- Persisted LLM-generated improvement plans per branch and period.
-- ============================================================
create table public.improvement_narratives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  branch_id uuid not null references public.branches on delete cascade,
  branch_name text not null check (char_length(branch_name) between 1 and 120),
  period text not null check (period in ('7d', '30d')),
  title text not null check (char_length(title) between 3 and 200),
  narrative text not null check (char_length(narrative) between 10 and 4000),
  urgency text not null check (urgency in ('urgente', 'esta semana', 'próximo ciclo')),
  generated_by_llm boolean not null default true,
  actor_user_id uuid references public.profiles on delete set null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, branch_id, period)
);

create index improvement_narratives_org_period_idx
  on public.improvement_narratives (organization_id, period, updated_at desc);

alter table public.improvement_narratives enable row level security;

create policy "improvement_narratives: organization members select"
  on public.improvement_narratives for select
  to authenticated
  using (
    organization_id in (select public.user_organization_ids())
  );

create policy "improvement_narratives: owner/manager insert"
  on public.improvement_narratives for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "improvement_narratives: owner/manager update"
  on public.improvement_narratives for update
  to authenticated
  using (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  )
  with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );
