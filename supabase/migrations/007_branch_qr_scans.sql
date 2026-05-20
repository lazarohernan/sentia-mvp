-- Track feedback QR page visits per branch.
create table public.branch_qr_scans (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations on delete cascade,
  branch_id       uuid not null references public.branches on delete cascade,
  source          text not null default 'feedback_page' check (char_length(source) between 3 and 80),
  created_at      timestamptz not null default now()
);

create index branch_qr_scans_branch_created_idx
  on public.branch_qr_scans (branch_id, created_at desc);

create index branch_qr_scans_org_created_idx
  on public.branch_qr_scans (organization_id, created_at desc);

alter table public.branch_qr_scans enable row level security;

create policy "branch_qr_scans: member select"
  on public.branch_qr_scans for select
  using (organization_id in (select public.user_organization_ids()));
