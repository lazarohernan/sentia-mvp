-- ============================================================
-- 16. IMPROVEMENT WEEKLY DIGESTS
-- Compressed weekly batches used to roll up monthly narratives.
-- ============================================================
create table public.improvement_weekly_digests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  branch_id uuid not null references public.branches on delete cascade,
  branch_name text not null check (char_length(branch_name) between 1 and 120),
  window_key text not null check (char_length(window_key) between 8 and 40),
  window_label text not null check (char_length(window_label) between 3 and 120),
  period_start date not null,
  period_end date not null,
  digest jsonb not null default '{}'::jsonb,
  title text not null check (char_length(title) between 3 and 200),
  narrative text not null check (char_length(narrative) between 10 and 4000),
  urgency text not null check (urgency in ('urgente', 'esta semana', 'próximo ciclo')),
  comment_count integer not null default 0 check (comment_count >= 0),
  comment_fingerprint text not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, branch_id, window_key)
);

create index improvement_weekly_digests_org_range_idx
  on public.improvement_weekly_digests (organization_id, period_start, period_end);

alter table public.improvement_weekly_digests enable row level security;

create policy "improvement_weekly_digests: organization members select"
  on public.improvement_weekly_digests for select
  to authenticated
  using (
    organization_id in (select public.user_organization_ids())
  );

create policy "improvement_weekly_digests: owner/manager insert"
  on public.improvement_weekly_digests for insert
  to authenticated
  with check (
    organization_id in (
      select organization_id
      from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "improvement_weekly_digests: owner/manager update"
  on public.improvement_weekly_digests for update
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
