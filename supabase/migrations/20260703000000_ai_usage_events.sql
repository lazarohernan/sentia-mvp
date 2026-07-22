-- ============================================================
-- AI USAGE EVENTS
-- Real token and cost tracking per organization, use case, and model.
-- ============================================================
create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  branch_id uuid references public.branches on delete set null,
  submission_id uuid references public.feedback_submissions on delete set null,
  use_case text not null check (
    use_case in (
      'feedback_triage',
      'operational_report',
      'improvement_narrative',
      'executive_summary',
      'manual_estimate'
    )
  ),
  provider text not null check (provider in ('openai', 'huggingface', 'internal')),
  model text not null,
  operation text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  reasoning_output_tokens integer not null default 0 check (reasoning_output_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  estimated_cost_usd numeric(12, 8),
  currency text not null default 'USD',
  pricing_source text,
  pricing_effective_date date,
  raw_usage jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index ai_usage_events_org_occurred_idx
  on public.ai_usage_events (organization_id, occurred_at desc);

create index ai_usage_events_org_use_case_idx
  on public.ai_usage_events (organization_id, use_case, occurred_at desc);

create index ai_usage_events_submission_idx
  on public.ai_usage_events (submission_id)
  where submission_id is not null;

alter table public.ai_usage_events enable row level security;

create policy "ai_usage_events: organization members select"
  on public.ai_usage_events for select
  using (organization_id in (select public.user_organization_ids()));

revoke all on table public.ai_usage_events from anon;
grant select on table public.ai_usage_events to authenticated;
grant all on table public.ai_usage_events to service_role;
