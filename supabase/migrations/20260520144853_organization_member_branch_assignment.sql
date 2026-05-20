alter table public.organization_members
  add column branch_id uuid references public.branches(id) on delete set null;

create index organization_members_branch_id_idx
  on public.organization_members(branch_id);
