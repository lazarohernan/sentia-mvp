-- Escucha deja de ser un permiso de rol y pasa a ser participación por miembro.

alter table public.organization_members
  add column if not exists participates_in_listening boolean not null default false;

comment on column public.organization_members.participates_in_listening is
  'Si el colaborador puede evaluarse en Escucha. Independiente de permisos de plataforma.';

-- Migrar: quien tenía el permiso listening en su rol pasa a participación.
update public.organization_members om
set participates_in_listening = true
where om.role = 'collaborator'
  and exists (
    select 1
    from public.organization_roles r
    where r.id = om.organization_role_id
      and r.permissions @> array['listening']::text[]
  );

-- Roles que solo tenían listening: quitar asignación y eliminar el rol vacío.
update public.organization_members om
set organization_role_id = null
where om.organization_role_id in (
  select r.id
  from public.organization_roles r
  where r.permissions = array['listening']::text[]
     or (
       cardinality(r.permissions) > 0
       and not exists (
         select 1
         from unnest(r.permissions) as permission
         where permission <> 'listening'
       )
     )
);

delete from public.organization_roles
where permissions = array['listening']::text[]
   or (
     cardinality(permissions) > 0
     and not exists (
       select 1
       from unnest(permissions) as permission
       where permission <> 'listening'
     )
   );

-- Quitar listening de roles mixtos.
update public.organization_roles
set
  permissions = (
    select array_agg(permission order by permission)
    from unnest(permissions) as permission
    where permission <> 'listening'
  ),
  updated_at = now()
where 'listening' = any (permissions);

-- Actualizar check de permisos permitidos (sin listening).
alter table public.organization_roles
  drop constraint if exists organization_roles_permissions_check;

alter table public.organization_roles
  add constraint organization_roles_permissions_check
  check (
    permissions <@ array[
      'summary',
      'comments',
      'alerts',
      'branches',
      'team',
      'settings'
    ]::text[]
  );

create index if not exists organization_members_listening_participation_idx
  on public.organization_members (organization_id, participates_in_listening)
  where participates_in_listening = true;
