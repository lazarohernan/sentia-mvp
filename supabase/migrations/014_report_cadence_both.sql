alter table public.organizations
  drop constraint if exists organizations_report_cadence_check;

alter table public.organizations
  add constraint organizations_report_cadence_check
  check (report_cadence in ('weekly', 'monthly', 'both'));
