alter table public.organizations
  add column if not exists report_cadence text not null default 'monthly'
  check (report_cadence in ('weekly', 'monthly'));
