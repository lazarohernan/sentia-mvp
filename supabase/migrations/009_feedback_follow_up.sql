-- Feedback workflow, follow-up audit trail, and alert escalation contacts.

alter table public.feedback_submissions
  add column if not exists workflow_status text not null default 'nuevo'
    check (workflow_status in ('nuevo', 'en_revision', 'en_proceso', 'resuelto', 'escalado')),
  add column if not exists assigned_user_id uuid references public.profiles (id) on delete set null,
  add column if not exists first_response_at timestamptz,
  add column if not exists resolved_at timestamptz;

alter table public.organizations
  add column if not exists alert_escalation_phone text,
  add column if not exists alert_escalation_email text;

create table if not exists public.feedback_follow_up_actions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.feedback_submissions on delete cascade,
  organization_id uuid not null references public.organizations on delete cascade,
  actor_user_id uuid not null references public.profiles on delete cascade,
  action_type text not null check (
    action_type in ('status_change', 'note', 'assignment', 'escalation')
  ),
  previous_status text,
  new_status text,
  note text check (note is null or char_length(note) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists feedback_follow_up_actions_submission_id_idx
  on public.feedback_follow_up_actions (submission_id, created_at desc);

create index if not exists feedback_submissions_workflow_status_idx
  on public.feedback_submissions (workflow_status);

alter table public.feedback_follow_up_actions enable row level security;

create policy "feedback_submissions: member update workflow"
  on public.feedback_submissions
  for update
  to authenticated
  using (
    branch_id in (
      select id
      from public.branches
      where organization_id in (select public.user_organization_ids())
    )
  )
  with check (
    branch_id in (
      select id
      from public.branches
      where organization_id in (select public.user_organization_ids())
    )
  );

create policy "feedback_follow_up_actions: member select"
  on public.feedback_follow_up_actions
  for select
  to authenticated
  using (organization_id in (select public.user_organization_ids()));

create policy "feedback_follow_up_actions: member insert"
  on public.feedback_follow_up_actions
  for insert
  to authenticated
  with check (
    organization_id in (select public.user_organization_ids())
    and actor_user_id = auth.uid()
  );
