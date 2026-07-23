-- Acuerdos de coaching de escucha (privados del gerente).

create table public.listening_coaching_actions (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_user_id uuid not null references public.profiles(id) on delete cascade,
  author_user_id uuid not null references public.profiles(id) on delete cascade,
  action_text text not null check (char_length(trim(action_text)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, subject_user_id)
);

comment on table public.listening_coaching_actions is
  'Ultima accion acordada en coaching de escucha por colaborador. Solo owner/manager.';

create index listening_coaching_actions_subject_idx
  on public.listening_coaching_actions (subject_user_id);

alter table public.listening_coaching_actions enable row level security;

create policy "listening_coaching_actions: owner/manager select"
  on public.listening_coaching_actions for select
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "listening_coaching_actions: owner/manager insert"
  on public.listening_coaching_actions for insert
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
    and author_user_id = auth.uid()
  );

create policy "listening_coaching_actions: owner/manager update"
  on public.listening_coaching_actions for update
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  )
  with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
        and role in ('owner', 'manager')
    )
    and author_user_id = auth.uid()
  );

grant select, insert, update on public.listening_coaching_actions to authenticated;
grant all on public.listening_coaching_actions to service_role;
