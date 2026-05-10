-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own row select"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: own row update"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- 2. ORGANIZATIONS
-- ============================================================
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.organizations enable row level security;

-- ============================================================
-- 3. ORGANIZATION MEMBERS
-- ============================================================
create table public.organization_members (
  user_id         uuid not null references public.profiles on delete cascade,
  organization_id uuid not null references public.organizations on delete cascade,
  role            text not null check (role in ('owner', 'manager', 'collaborator')),
  created_at      timestamptz not null default now(),
  primary key (user_id, organization_id)
);

alter table public.organization_members enable row level security;

create policy "org_members: own rows select"
  on public.organization_members for select
  using (user_id = auth.uid());

-- ============================================================
-- 4. HELPER FUNCTION (used by RLS policies)
-- ============================================================
create or replace function public.user_organization_ids()
returns setof uuid language sql stable security definer as $$
  select organization_id
  from public.organization_members
  where user_id = auth.uid()
$$;

-- ============================================================
-- 5. ORGANIZATIONS RLS (needs helper function)
-- ============================================================
create policy "organizations: member select"
  on public.organizations for select
  using (id in (select public.user_organization_ids()));

-- ============================================================
-- 6. BRANCHES
-- ============================================================
create table public.branches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  name            text not null,
  slug            text not null,
  address         text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, slug)
);

alter table public.branches enable row level security;

create policy "branches: member select"
  on public.branches for select
  using (organization_id in (select public.user_organization_ids()));

create policy "branches: owner/manager insert"
  on public.branches for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

create policy "branches: owner/manager update"
  on public.branches for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

create policy "branches: owner/manager delete"
  on public.branches for delete
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
      and role in ('owner', 'manager')
    )
  );

-- ============================================================
-- 7. FEEDBACK SUBMISSIONS
-- ============================================================
create table public.feedback_submissions (
  id               uuid primary key default gen_random_uuid(),
  branch_id        uuid not null references public.branches on delete cascade,
  type             text not null check (type in ('complaint', 'suggestion', 'compliment', 'recommendation')),
  emotion_score    smallint not null check (emotion_score between 1 and 5),
  csat_score       smallint check (csat_score between 1 and 5),
  nps_score        smallint check (nps_score between 0 and 10),
  free_text        text not null,
  contact_name     text,
  contact_phone    text,
  contact_email    text,
  consent_accepted boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.feedback_submissions enable row level security;

-- Anonymous INSERT: anyone with anon key can submit feedback
create policy "feedback_submissions: anon insert"
  on public.feedback_submissions for insert
  with check (consent_accepted = true);

-- SELECT: only members of the org that owns the branch
create policy "feedback_submissions: member select"
  on public.feedback_submissions for select
  using (
    branch_id in (
      select id from public.branches
      where organization_id in (select public.user_organization_ids())
    )
  );

-- ============================================================
-- 8. AI ANALYSES
-- ============================================================
create table public.ai_analyses (
  id                 uuid primary key default gen_random_uuid(),
  submission_id      uuid not null unique references public.feedback_submissions on delete cascade,
  status             text not null check (status in ('completed', 'disabled', 'unavailable')),
  sentiment          text check (sentiment in ('positive', 'neutral', 'negative')),
  polarity           numeric(5, 3),
  urgency            text check (urgency in ('low', 'medium', 'high', 'critical')),
  category           text,
  summary            text,
  recommended_action text,
  keywords           text[] not null default '{}',
  entities           text[] not null default '{}',
  model_used         text,
  confidence         numeric(5, 4),
  created_at         timestamptz not null default now()
);

alter table public.ai_analyses enable row level security;

create policy "ai_analyses: member select"
  on public.ai_analyses for select
  using (
    submission_id in (
      select id from public.feedback_submissions
      where branch_id in (
        select id from public.branches
        where organization_id in (select public.user_organization_ids())
      )
    )
  );

-- ============================================================
-- 9. LISTENING EVENTS
-- ============================================================
create table public.listening_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  branch_id       uuid references public.branches on delete set null,
  user_id         uuid not null references public.profiles on delete cascade,
  level           text not null check (level in ('download', 'debate', 'empathetic_listening', 'generative_dialogue')),
  note            text check (char_length(note) <= 500),
  created_at      timestamptz not null default now()
);

alter table public.listening_events enable row level security;

create policy "listening_events: member select"
  on public.listening_events for select
  using (organization_id in (select public.user_organization_ids()));

create policy "listening_events: member insert"
  on public.listening_events for insert
  with check (
    organization_id in (select public.user_organization_ids())
    and user_id = auth.uid()
  );

-- ============================================================
-- 10. RPC: create_user_organization (atomic sign-up)
-- Runs as SECURITY DEFINER to bypass RLS during onboarding.
-- ============================================================
create or replace function public.create_user_organization(
  p_user_id     uuid,
  p_full_name   text,
  p_org_name    text,
  p_org_slug    text
)
returns uuid language plpgsql security definer as $$
declare
  v_org_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (p_user_id, p_full_name);

  insert into public.organizations (name, slug)
  values (p_org_name, p_org_slug)
  returning id into v_org_id;

  insert into public.organization_members (user_id, organization_id, role)
  values (p_user_id, v_org_id, 'owner');

  return v_org_id;
end;
$$;
